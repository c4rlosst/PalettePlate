import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../src/db";
import { user, preferences, foods, entries } from "../src/db/schema";
import {
  logMeal,
  dailyEntries,
  deleteEntry,
  setPreference,
  saveProfile,
  getProfile,
} from "../src/server/data";
import { manilaDay } from "../src/lib/rainbow";
const enabled = process.env.RUN_DB_TESTS === "1";
const alice = { id: crypto.randomUUID(), role: "user", emailVerified: true };
const bob = { id: crypto.randomUUID(), role: "user", emailVerified: true };
describe.skipIf(!enabled)("real MySQL account isolation", () => {
  let mealId = "";
  beforeAll(async () => {
    await getDb()
      .insert(user)
      .values(
        [alice, bob].map((actor) => ({
          id: actor.id,
          name: "Isolation test",
          email: `${actor.id}@paletteplate.test`,
          emailVerified: true,
        })),
      );
  });
  afterAll(async () => {
    await getDb()
      .delete(user)
      .where(inArray(user.id, [alice.id, bob.id]));
  });
  it("returns a logged meal only to its owner", async () => {
    const localTime = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .format(new Date())
      .replace(" ", "T");
    mealId = await logMeal(bob, {
      mealType: "lunch",
      localTime,
      foodIds: ["kalabasa", "kamatis"],
    });
    expect(await dailyEntries(alice, manilaDay())).toHaveLength(0);
    expect((await dailyEntries(bob, manilaDay())).map((e) => e.id)).toContain(
      mealId,
    );
  });
  it("rejects deleting another account’s meal and preserves it", async () => {
    await expect(deleteEntry(alice, mealId)).rejects.toThrow("access");
    expect(
      await getDb().select().from(entries).where(eq(entries.id, mealId)),
    ).toHaveLength(1);
    await deleteEntry(bob, mealId);
    expect(
      await getDb().select().from(entries).where(eq(entries.id, mealId)),
    ).toHaveLength(0);
  });
  it("keeps preference writes on the authenticated account", async () => {
    await setPreference(alice, {
      userId: bob.id,
      foodId: "kalabasa",
      preference: "liked",
    });
    const results = await getDb()
      .select()
      .from(preferences)
      .where(inArray(preferences.userId, [alice.id, bob.id]));
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe(alice.id);
  });
  it("does not change another profile or elevate roles", async () => {
    await saveProfile(alice, {
      id: bob.id,
      name: "Updated test",
      region: "Davao Region",
      gender: "",
      contactNumber: "",
      role: "admin",
    });
    expect((await getProfile(bob))?.name).toBe("Isolation test");
    const [stored] = await getDb()
      .select()
      .from(user)
      .where(eq(user.id, alice.id));
    expect(stored.role).toBe("user");
    expect(stored.name).toBe("Updated test");
  });
  it("keeps all imported nutritional values null and flagged", async () => {
    const data = await getDb().select().from(foods);
    expect(data.length).toBeGreaterThan(0);
    expect(
      data.every(
        (f) =>
          f.nutritionMissing &&
          f.energyKcal === null &&
          f.proteinG === null &&
          f.fibreG === null,
      ),
    ).toBe(true);
  });
});
