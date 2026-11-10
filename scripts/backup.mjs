import "dotenv/config";
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";
const mode = process.argv[2];
async function main() {
  if (!["dump", "restore"].includes(mode) || !process.env.DATABASE_URL)
    throw new Error(
      "Use npm run db:dump or npm run db:restore -- backups/FILE.sql after configuring DATABASE_URL.",
    );
  const url = new URL(process.env.DATABASE_URL);
  const db = url.pathname.slice(1);
  if (!/^[a-zA-Z0-9_]+$/.test(db)) throw new Error("Invalid database name.");
  const args = [
    "--no-defaults",
    `--host=${url.hostname}`,
    `--port=${url.port || 3306}`,
    `--user=${decodeURIComponent(url.username)}`,
  ];
  if (process.env.DATABASE_TLS === "true") {
    args.push("--ssl-mode=VERIFY_IDENTITY");
    if (process.env.DATABASE_CA_FILE)
      args.push(`--ssl-ca=${process.env.DATABASE_CA_FILE}`);
  }
  let file;
  if (mode === "dump") {
    mkdirSync("backups", { recursive: true });
    file = `backups/paletteplate-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
    args.push(
      "--single-transaction",
      "--no-tablespaces",
      "--set-gtid-purged=OFF",
      db,
    );
  } else {
    file = process.argv[3];
    if (!file || !process.argv.includes("--confirm"))
      throw new Error(
        "Restore replaces existing data. Use npm run db:restore -- backups/FILE.sql --confirm",
      );
    args.push(db);
  }
  const binary =
    mode === "dump"
      ? process.env.MYSQLDUMP_BIN || "mysqldump"
      : process.env.MYSQL_BIN || "mysql";
  const child = spawn(binary, args, {
    shell: false,
    windowsHide: true,
    env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stderr.resume();
  const ended = new Promise((resolve, reject) => {
    child.on("error", () =>
      reject(
        new Error("MySQL tools unavailable. Set MYSQL_BIN and MYSQLDUMP_BIN."),
      ),
    );
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              "Backup operation failed. Check connection and permissions.",
            ),
          ),
    );
  });
  if (mode === "dump") {
    child.stdin.end();
    await Promise.all([
      pipeline(child.stdout, createWriteStream(file, { mode: 0o600 })),
      ended,
    ]);
    console.log(`Backup saved to ${file}`);
  } else {
    child.stdout.resume();
    await Promise.all([pipeline(createReadStream(file), child.stdin), ended]);
    console.log("Restore complete.");
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
