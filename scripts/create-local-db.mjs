import "dotenv/config";
import mysql from "mysql2/promise";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
async function main() {
  const admin = process.env.DATABASE_ADMIN_URL;
  if (!admin) throw new Error("Set DATABASE_ADMIN_URL in .env, then retry.");
  const url = new URL(admin);
  if (!["127.0.0.1", "localhost", "::1"].includes(url.hostname))
    throw new Error("This script only creates a local database.");
  const connection = await mysql.createConnection(admin);
  try {
    const [existing] = await connection.query(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
      ["paletteplate"],
    );
    if (existing.length)
      throw new Error(
        "Database paletteplate already exists. No changes made. Set DATABASE_URL to the existing app connection.",
      );
    const password = randomBytes(32).toString("base64url");
    await connection.query(
      "CREATE DATABASE `paletteplate` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci",
    );
    await connection.query(
      "CREATE USER 'paletteplate_app'@'localhost' IDENTIFIED BY ?",
      [password],
    );
    await connection.query(
      "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON `paletteplate`.* TO 'paletteplate_app'@'localhost'",
    );
    url.username = "paletteplate_app";
    url.password = password;
    url.pathname = "/paletteplate";
    let env = await readFile(".env", "utf8");
    env = env
      .replace(/^DATABASE_ADMIN_URL=.*\r?\n?/m, "")
      .replace(/^DATABASE_URL=.*\r?\n?/m, "");
    env += `\nDATABASE_URL=${url.toString()}\n`;
    await writeFile(".env", env, { mode: 0o600 });
    console.log(
      "Created paletteplate and its app account. Saved the connection in .env and removed the admin URL.",
    );
  } finally {
    await connection.end();
  }
}
main().catch((e) => {
  console.error(
    e.message?.startsWith("Set ") ||
      e.message?.startsWith("Database ") ||
      e.message?.startsWith("This script")
      ? e.message
      : "Could not create the database. Check the local admin connection and permissions.",
  );
  process.exitCode = 1;
});
