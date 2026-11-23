"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { currentActor } from "@/server/session";
import {
  setPreference,
  logMeal,
  deleteEntry,
  saveProfile,
  createRecipe,
  deleteRecipe,
} from "@/server/data";
export type ActionResult = { ok: boolean; message: string; id?: string };
async function run(work: () => Promise<unknown>): Promise<ActionResult> {
  try {
    const result = await work();
    revalidatePath("/");
    revalidatePath("/foods");
    revalidatePath("/profile");
    revalidatePath("/recipes");
    return {
      ok: true,
      message: "Saved.",
      ...(typeof result === "string" ? { id: result } : {}),
    };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof ZodError
          ? e.issues[0]?.message || "Check the form and try again."
          : e instanceof Error && !("query" in e) && !("cause" in e)
            ? e.message
            : "Could not save. Check the database connection and try again.",
    };
  }
}
export async function preferenceAction(input: unknown) {
  return run(async () => setPreference(await currentActor(), input));
}
export async function mealAction(input: unknown) {
  return run(async () => logMeal(await currentActor(), input));
}
export async function deleteMealAction(id: string) {
  return run(async () => deleteEntry(await currentActor(), id));
}
export async function createRecipeAction(input: unknown) {
  return run(async () => createRecipe(await currentActor(), input));
}
export async function deleteRecipeAction(id: string) {
  return run(async () => deleteRecipe(await currentActor(), id));
}
export async function profileAction(input: unknown) {
  return run(async () => saveProfile(await currentActor(), input));
}
