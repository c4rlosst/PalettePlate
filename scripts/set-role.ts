import "dotenv/config";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
const roles = ["user", "moderator", "admin"];
async function main() {
  const [email, role = "admin"] = process.argv.slice(2);
  if (!email || !email.includes("@") || !roles.includes(role))
    throw new Error(
      "Usage: npm run user:role -- you@example.com [admin|moderator|user]",
    );
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
  });
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT id, email_verified FROM users WHERE LOWER(email) = ?",
      [email.trim().toLowerCase()],
    );
    if (!rows.length)
      throw new Error(
        "No account has that email yet. Sign up and verify it first, then run this again.",
      );
    if (!rows[0].email_verified)
      throw new Error("Verify that account's email before changing its role.");
    await connection.query(
      "UPDATE users SET role = ?, updated_at = ? WHERE id = ?",
      [role, new Date(), rows[0].id],
    );
    console.log(`${email} is now ${role}.`);
  } finally {
    await connection.end();
  }
}
main().catch((e) => {
  console.error(
    e instanceof Error && /^(Usage|Set |No account|Verify)/.test(e.message)
      ? e.message
      : "Could not change the role. Check the database connection.",
  );
  process.exitCode = 1;
});
