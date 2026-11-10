import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
const base =
  process.env.MYSQL_BASE_DIR || "C:/Program Files/MySQL/MySQL Server 9.6";
const binary = join(base, "bin", "mysqld.exe");
const folder = resolve(".local/mysql");
const data = join(folder, "data");
const init = join(folder, "initialize.sql");
const credentials = join(folder, "admin-url");
const port = 3307;
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              "MySQL initialization failed. Check .local/mysql/mysql-error.log.",
            ),
          ),
    );
  });
}
async function connect(url) {
  return mysql.createConnection({ uri: url, connectTimeout: 1000 });
}
async function main() {
  if (!existsSync(binary))
    throw new Error(
      "Set MYSQL_BASE_DIR to your MySQL Server installation folder.",
    );
  await mkdir(folder, { recursive: true });
  let url;
  if (!existsSync(data)) {
    const password = randomBytes(32).toString("base64url");
    url = `mysql://root:${password}@127.0.0.1:${port}`;
    await writeFile(credentials, url, { mode: 0o600 });
    await run([
      "--no-defaults",
      `--basedir=${base}`,
      `--datadir=${data}`,
      "--initialize-insecure",
      `--log-error=${join(folder, "mysql-error.log")}`,
    ]);
    // The init file runs before network clients are accepted; root is never exposed without a password.
    await writeFile(
      init,
      `ALTER USER 'root'@'localhost' IDENTIFIED BY '${password}';\n`,
      { mode: 0o600 },
    );
  } else {
    url = (await readFile(credentials, "utf8")).trim();
  }
  let running = false;
  try {
    const c = await connect(url);
    await c.end();
    running = true;
  } catch {}
  if (!running) {
    const args = [
      "--no-defaults",
      `--basedir=${base}`,
      `--datadir=${data}`,
      "--bind-address=127.0.0.1",
      `--port=${port}`,
      "--mysqlx=OFF",
      "--character-set-server=utf8mb4",
      "--collation-server=utf8mb4_0900_ai_ci",
      `--log-error=${join(folder, "mysql-error.log")}`,
      `--pid-file=${join(folder, "mysql.pid")}`,
      ...(existsSync(init) ? [`--init-file=${init}`] : []),
    ];
    const child = spawn(binary, args, {
      windowsHide: true,
      detached: true,
      stdio: "ignore",
    });
    child.on("error", () => {});
    child.unref();
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const c = await connect(url);
        await c.end();
        running = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!running)
      throw new Error(
        "Local MySQL did not start. Check .local/mysql/mysql-error.log.",
      );
  }
  if (existsSync(init)) await unlink(init);
  let env = existsSync(".env") ? await readFile(".env", "utf8") : "";
  if (!/^DATABASE_URL=.+/m.test(env)) {
    env = env.replace(/^DATABASE_ADMIN_URL=.*\r?\n?/m, "");
    await writeFile(".env", `${env}\nDATABASE_ADMIN_URL=${url}\n`, {
      mode: 0o600,
    });
  }
  console.log(
    "PalettePlate MySQL is running on 127.0.0.1:3307. Existing MySQL instances are unchanged.",
  );
}
main().catch((e) => {
  console.error(
    e.message?.includes("password")
      ? "Could not start local MySQL. Check its configuration."
      : e.message,
  );
  process.exitCode = 1;
});
