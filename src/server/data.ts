import "server-only";
import { and, asc, eq, gte, lt, like, or, inArray, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  foods,
  preferences,
  entries,
  entryFoods,
  entryRecipes,
  recipes,
  recipeIngredients,
  user,
} from "@/db/schema";
import { colours, dayBounds, manilaDay } from "@/lib/rainbow";
import { requireVerified, requireOwner, type Actor } from "./policy";
const foodQuery = z.object({
  search: z.string().trim().max(100).default(""),
  colour: z.enum(colours).optional(),
  category: z.enum(["fruit", "vegetable", "grain"]).optional(),
});
export async function browseFoods(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const query = foodQuery.parse(input);
  const db = getDb();
  return db
    .select({
      id: foods.id,
      filipinoName: foods.filipinoName,
      englishName: foods.englishName,
      colour: foods.colour,
      category: foods.category,
      preference: preferences.preference,
    })
    .from(foods)
    .leftJoin(
      preferences,
      and(eq(preferences.foodId, foods.id), eq(preferences.userId, actor.id)),
    )
    .where(
      and(
        eq(foods.archived, false),
        query.search
          ? or(
              like(
                foods.filipinoName,
                `%${query.search.replace(/[%_\\]/g, "\\$&")}%`,
              ),
              like(
                foods.englishName,
                `%${query.search.replace(/[%_\\]/g, "\\$&")}%`,
              ),
            )
          : undefined,
        query.colour ? eq(foods.colour, query.colour) : undefined,
        query.category ? eq(foods.category, query.category) : undefined,
      ),
    )
    .orderBy(foods.filipinoName)
    .limit(100);
}
export async function setPreference(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const data = z
    .object({
      foodId: z.string().min(1).max(36),
      preference: z.enum(["liked", "disliked", "clear"]),
    })
    .parse(input);
  const db = getDb();
  const [food] = await db
    .select({ id: foods.id })
    .from(foods)
    .where(and(eq(foods.id, data.foodId), eq(foods.archived, false)))
    .limit(1);
  if (!food)
    throw new Error("That food is no longer available. Refresh the food list.");
  if (data.preference === "clear") {
    await db
      .delete(preferences)
      .where(
        and(
          eq(preferences.userId, actor.id),
          eq(preferences.foodId, data.foodId),
        ),
      );
    return;
  }
  await db
    .insert(preferences)
    .values({
      userId: actor.id,
      foodId: data.foodId,
      preference: data.preference,
    })
    .onDuplicateKeyUpdate({ set: { preference: data.preference } });
}
const entryInput = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  localTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  foodIds: z
    .array(z.string().min(1).max(36))
    .min(1, "Choose at least one food.")
    .max(50),
});
export async function logMeal(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const data = entryInput.parse(input);
  const ids = [...new Set(data.foodIds)];
  const eatenAt = new Date(`${data.localTime}:00+08:00`);
  if (
    !Number.isFinite(eatenAt.getTime()) ||
    manilaDay(eatenAt) !== data.localTime.slice(0, 10) ||
    eatenAt.getTime() > Date.now() + 60000
  )
    throw new Error("Choose a valid meal time that is not in the future.");
  const db = getDb();
  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    const selected = await tx
      .select()
      .from(foods)
      .where(and(inArray(foods.id, ids), eq(foods.archived, false)));
    if (selected.length !== ids.length)
      throw new Error("Some foods are unavailable. Refresh and choose again.");
    await tx
      .insert(entries)
      .values({ id, userId: actor.id, mealType: data.mealType, eatenAt });
    await tx
      .insert(entryFoods)
      .values(
        selected.map((f) => ({
          entryId: id,
          foodId: f.id,
          colour: f.colour,
          category: f.category,
        })),
      );
  });
  return id;
}
export async function dailyEntries(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const day = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .parse(input);
  const { start, end } = dayBounds(day);
  return getDb()
    .select({
      id: entries.id,
      mealType: entries.mealType,
      eatenAt: entries.eatenAt,
      foodId: foods.id,
      filipinoName: foods.filipinoName,
      englishName: foods.englishName,
      colour: entryFoods.colour,
      category: entryFoods.category,
    })
    .from(entries)
    .innerJoin(entryFoods, eq(entryFoods.entryId, entries.id))
    .innerJoin(foods, eq(foods.id, entryFoods.foodId))
    .where(
      and(
        eq(entries.userId, actor.id),
        gte(entries.eatenAt, start),
        lt(entries.eatenAt, end),
      ),
    )
    .orderBy(desc(entries.eatenAt));
}
export async function deleteEntry(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const id = z.string().uuid().parse(input);
  const db = getDb();
  const [entry] = await db
    .select({ userId: entries.userId })
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  if (!entry) throw new Error("This meal was not found. Refresh your day.");
  requireOwner(actor, entry.userId);
  await db
    .delete(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, actor.id)));
}
const recipeInput = z.object({
  name: z.string().trim().min(1, "Give your recipe a name.").max(160),
  description: z.string().trim().max(2000).default(""),
  instructions: z.string().trim().max(8000).default(""),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  sections: z
    .array(
      z.object({
        title: z.string().trim().max(80).default(""),
        items: z
          .array(
            z.object({
              amount: z.string().trim().max(100).default(""),
              item: z
                .string()
                .trim()
                .min(1, "Every ingredient needs a name.")
                .max(200),
              foodId: z.string().max(36).default(""),
            }),
          )
          .min(1)
          .max(40),
      }),
    )
    .min(1, "Add at least one ingredient.")
    .max(8),
});
export async function createRecipe(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const data = recipeInput.parse(input);
  const lines = data.sections.flatMap((s) =>
    s.items.map((i) => ({ ...i, section: s.title })),
  );
  if (lines.length > 80)
    throw new Error("A recipe can have up to 80 ingredients.");
  const foodIds = [...new Set(lines.map((l) => l.foodId).filter(Boolean))];
  const db = getDb();
  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    if (foodIds.length) {
      const found = await tx
        .select({ id: foods.id })
        .from(foods)
        .where(and(inArray(foods.id, foodIds), eq(foods.archived, false)));
      if (found.length !== foodIds.length)
        throw new Error("Some linked foods are unavailable. Refresh and retry.");
    }
    await tx.insert(recipes).values({
      id,
      userId: actor.id,
      name: data.name,
      description: data.description,
      instructions: data.instructions || null,
      mealType: data.mealType,
    });
    await tx.insert(recipeIngredients).values(
      lines.map((l, position) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        foodId: l.foodId || null,
        section: l.section,
        position,
        item: l.item,
        amount: l.amount,
      })),
    );
  });
  return id;
}
export async function listRecipes(actor: Actor | null) {
  requireVerified(actor);
  const db = getDb();
  const mine = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      description: recipes.description,
      mealType: recipes.mealType,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(eq(recipes.userId, actor.id))
    .orderBy(desc(recipes.createdAt))
    .limit(100);
  if (!mine.length) return [];
  const lines = await db
    .select({
      recipeId: recipeIngredients.recipeId,
      colour: foods.colour,
      category: foods.category,
    })
    .from(recipeIngredients)
    .leftJoin(foods, eq(foods.id, recipeIngredients.foodId))
    .where(
      inArray(
        recipeIngredients.recipeId,
        mine.map((r) => r.id),
      ),
    );
  return mine.map((r) => {
    const own = lines.filter((l) => l.recipeId === r.id);
    return {
      ...r,
      ingredientCount: own.length,
      colours: [
        ...new Set(
          own
            .filter(
              (l) =>
                l.colour && (l.category === "fruit" || l.category === "vegetable"),
            )
            .map((l) => l.colour!),
        ),
      ],
    };
  });
}
export async function getRecipe(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const id = z.string().uuid().parse(input);
  const db = getDb();
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe) throw new Error("This recipe was not found.");
  requireOwner(actor, recipe.userId);
  const ingredients = await db
    .select({
      id: recipeIngredients.id,
      section: recipeIngredients.section,
      position: recipeIngredients.position,
      item: recipeIngredients.item,
      amount: recipeIngredients.amount,
      colour: foods.colour,
      category: foods.category,
    })
    .from(recipeIngredients)
    .leftJoin(foods, eq(foods.id, recipeIngredients.foodId))
    .where(eq(recipeIngredients.recipeId, id))
    .orderBy(asc(recipeIngredients.position));
  return { recipe, ingredients };
}
export async function deleteRecipe(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const id = z.string().uuid().parse(input);
  const db = getDb();
  const [recipe] = await db
    .select({ userId: recipes.userId })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe) throw new Error("This recipe was not found.");
  requireOwner(actor, recipe.userId);
  const [used] = await db
    .select({ recipeId: entryRecipes.recipeId })
    .from(entryRecipes)
    .where(eq(entryRecipes.recipeId, id))
    .limit(1);
  if (used)
    throw new Error(
      "This recipe is part of a logged meal, so it cannot be deleted yet.",
    );
  await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, actor.id)));
}
export async function getProfile(actor: Actor | null) {
  requireVerified(actor);
  const [profile] = await getDb()
    .select({
      name: user.name,
      email: user.email,
      region: user.region,
      gender: user.gender,
      contactNumber: user.contactNumber,
    })
    .from(user)
    .where(eq(user.id, actor.id));
  return profile;
}
export async function saveProfile(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const data = z
    .object({
      name: z.string().trim().min(1).max(120),
      region: z.string().trim().max(100),
      gender: z.string().trim().max(50),
      contactNumber: z
        .string()
        .trim()
        .max(30)
        .refine(
          (v) => !v || /^[+\d ()-]{7,30}$/.test(v),
          "Enter a valid contact number or leave it blank.",
        ),
    })
    .parse(input);
  await getDb()
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, actor.id));
}
