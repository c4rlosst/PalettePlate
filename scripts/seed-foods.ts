import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { z } from "zod";
import { foods } from "../src/db/schema";
import { colours } from "../src/lib/rainbow";
// Transcribed commodity facts; translations and colour mapping are project annotations.
const source =
  "DA-AMAS, Weekly Average Retail Prices, October 26–November 1, 2026. https://www.da.gov.ph/wp-content/uploads/2026/11/Weekly-Average-Prices-October-26-November-1-2026.pdf | Licence: public domain unless otherwise stated, https://www.da.gov.ph/price-monitoring/ (checked 2026-11-10). Names only; no nutritional data copied. Colour and Filipino translations: PalettePlate editorial mapping.";
const raw = [
  ["ampalaya", "Ampalaya", "Bitter melon", "green", "vegetable"],
  ["talong", "Talong", "Eggplant", "blue-purple", "vegetable"],
  ["pechay", "Pechay", "Bok choy", "green", "vegetable"],
  ["sitaw", "Sitaw", "Yardlong beans", "green", "vegetable"],
  ["kalabasa", "Kalabasa", "Squash", "orange", "vegetable"],
  ["kamatis", "Kamatis", "Tomato", "red", "vegetable"],
  ["karot", "Karot", "Carrot", "orange", "vegetable"],
  ["sayote", "Sayote", "Chayote", "green", "vegetable"],
  ["patatas", "Patatas", "Potato", "white-brown", "vegetable"],
  ["bawang", "Bawang", "Garlic", "white-brown", "vegetable"],
  ["papaya", "Papaya", "Ripe papaya", "orange", "fruit"],
  ["mangga", "Mangga", "Ripe carabao mango", "yellow", "fruit"],
  ["saging", "Saging na lakatan", "Lakatan banana", "white-brown", "fruit"],
  ["pakwan", "Pakwan", "Watermelon", "red", "fruit"],
  ["abokado", "Abokado", "Avocado", "green", "fruit"],
  ["kanin", "Kanin", "White rice", "white-brown", "grain"],
];
const item = z.tuple([
  z.string().min(1).max(36),
  z.string().min(1).max(150),
  z.string().min(1).max(150),
  z.enum(colours),
  z.enum(["fruit", "vegetable", "grain"]),
]);
export function cleanFoods() {
  return raw.map((row) => {
    const [id, filipinoName, englishName, colour, category] = item.parse(
      row.map((v) => v.trim().normalize("NFC")),
    );
    return {
      id,
      filipinoName,
      englishName,
      colour,
      category,
      source,
      nutritionMissing: true,
      energyKcal: null,
      proteinG: null,
      fibreG: null,
    };
  });
}
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_TLS === "true"
        ? {
            rejectUnauthorized: true,
            ...(process.env.DATABASE_CA
              ? { ca: process.env.DATABASE_CA.replace(/\\n/g, "\n") }
              : {}),
          }
        : undefined,
  });
  try {
    const db = drizzle(connection);
    await db.transaction(async (tx) => {
      for (const row of cleanFoods())
        await tx
          .insert(foods)
          .values(row)
          .onDuplicateKeyUpdate({ set: { id: row.id } });
    });
    console.log(
      "Seed complete: 16 local foods. Nutritional values are unknown and flagged.",
    );
  } finally {
    await connection.end();
  }
}
main().catch(() => {
  console.error(
    "Food seed failed. Check database setup and run migrations first.",
  );
  process.exitCode = 1;
});
