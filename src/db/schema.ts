import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  bigint,
  decimal,
  mysqlEnum,
  primaryKey,
  index,
  uniqueIndex,
  check,
  customType,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
const sessionToken = customType<{ data: string }>({
  dataType: () => "varchar(255) COLLATE utf8mb4_bin",
});
export const user = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: mysqlEnum("role", ["user", "moderator", "admin"])
    .notNull()
    .default("user"),
  region: varchar("region", { length: 100 }),
  gender: varchar("gender", { length: 50 }),
  contactNumber: varchar("contact_number", { length: 30 }),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow(),
});
export const session = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    token: sessionToken("token").notNull().unique(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
export const account = mysqlTable(
  "accounts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 100 }).notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { fsp: 3 }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { fsp: 3 }),
    scope: text("scope"),
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow(),
  },
  (t) => [
    index("accounts_user_idx").on(t.userId),
    uniqueIndex("accounts_provider_idx").on(t.providerId, t.accountId),
  ],
);
export const verification = mysqlTable(
  "verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const rateLimit = mysqlTable("rate_limits", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  count: int("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const foods = mysqlTable(
  "foods",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    filipinoName: varchar("filipino_name", { length: 150 }).notNull(),
    englishName: varchar("english_name", { length: 150 }).notNull(),
    colour: mysqlEnum("colour", [
      "red",
      "orange",
      "yellow",
      "green",
      "blue-purple",
      "white-brown",
    ]).notNull(),
    category: mysqlEnum("category", ["fruit", "vegetable", "grain"]).notNull(),
    energyKcal: decimal("energy_kcal", { precision: 9, scale: 2 }),
    proteinG: decimal("protein_g", { precision: 9, scale: 2 }),
    fibreG: decimal("fibre_g", { precision: 9, scale: 2 }),
    source: text("source").notNull(),
    nutritionMissing: boolean("nutrition_missing").notNull().default(true),
    archived: boolean("archived").notNull().default(false),
  },
  (t) => [
    index("food_filipino_idx").on(t.filipinoName),
    index("food_english_idx").on(t.englishName),
    index("food_filter_idx").on(t.colour, t.category),
  ],
);
export const preferences = mysqlTable(
  "user_food_preferences",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    foodId: varchar("food_id", { length: 36 })
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    preference: mysqlEnum("preference", ["liked", "disliked"]).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.foodId] })],
);
export const recipes = mysqlTable("recipes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  mealType: mysqlEnum("meal_type", [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
  ]).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const recipeIngredients = mysqlTable(
  "recipe_ingredients",
  {
    recipeId: varchar("recipe_id", { length: 36 })
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    foodId: varchar("food_id", { length: 36 })
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    amount: varchar("amount", { length: 100 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.foodId] })],
);
export const favouriteRecipes = mysqlTable(
  "favourite_recipes",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: varchar("recipe_id", { length: 36 })
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);
export const entries = mysqlTable(
  "entries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mealType: mysqlEnum("meal_type", [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ]).notNull(),
    eatenAt: timestamp("eaten_at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("entries_user_date_idx").on(t.userId, t.eatenAt)],
);
export const entryFoods = mysqlTable(
  "entry_foods",
  {
    entryId: varchar("entry_id", { length: 36 })
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    foodId: varchar("food_id", { length: 36 })
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    colour: mysqlEnum("colour", [
      "red",
      "orange",
      "yellow",
      "green",
      "blue-purple",
      "white-brown",
    ]).notNull(),
    category: mysqlEnum("category", ["fruit", "vegetable", "grain"]).notNull(),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.foodId] })],
);
export const entryRecipes = mysqlTable(
  "entry_recipes",
  {
    entryId: varchar("entry_id", { length: 36 })
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    recipeId: varchar("recipe_id", { length: 36 })
      .notNull()
      .references(() => recipes.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.recipeId] })],
);
export const posts = mysqlTable(
  "posts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: varchar("recipe_id", { length: 36 }).references(
      () => recipes.id,
      { onDelete: "set null" },
    ),
    content: text("content").notNull(),
    status: mysqlEnum("status", ["draft", "pending", "approved", "rejected"])
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("post_status_date_idx").on(t.status, t.createdAt)],
);
export const comments = mysqlTable("comments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  postId: varchar("post_id", { length: 36 })
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const reactions = mysqlTable(
  "reactions",
  {
    postId: varchar("post_id", { length: 36 })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);
export const images = mysqlTable(
  "images",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    ownerId: varchar("owner_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    postId: varchar("post_id", { length: 36 }).references(() => posts.id, {
      onDelete: "restrict",
    }),
    recipeId: varchar("recipe_id", { length: 36 }).references(
      () => recipes.id,
      { onDelete: "restrict" },
    ),
    path: varchar("path", { length: 512 }).notNull().unique(),
    mimeType: varchar("mime_type", { length: 50 }).notNull(),
    size: int("size").notNull(),
  },
  (t) => [check("image_size_positive", sql`${t.size} > 0`)],
);
