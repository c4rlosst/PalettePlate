import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL in .env first.");
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
    multipleStatements: true,
  });
  try {
    await migrate(drizzle(connection), {
      migrationsFolder: "./src/db/migrations",
    });
    console.log("Migrations complete.");
  } finally {
    await connection.end();
  }
}
main().catch(() => {
  console.error(
    "Migration failed. Check database availability and configuration.",
  );
  process.exitCode = 1;
});
