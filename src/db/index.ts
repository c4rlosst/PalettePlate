import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
const state = globalThis as typeof globalThis & {
  paletteplateDb?: MySql2Database<typeof schema>;
};
export function getDb(): MySql2Database<typeof schema> {
  if (state.paletteplateDb) return state.paletteplateDb;
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Database is not configured. Follow the README setup steps.",
    );
  const url = new URL(process.env.DATABASE_URL);
  const pool = mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: Math.min(
      5,
      Math.max(1, Number(process.env.DATABASE_POOL_SIZE) || 3),
    ),
    timezone: "Z",
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
  state.paletteplateDb = drizzle(pool, { schema, mode: "default" });
  return state.paletteplateDb;
}
