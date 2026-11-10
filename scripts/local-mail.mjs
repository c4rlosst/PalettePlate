import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const local = resolve(".local/mailpit/mailpit.exe");
try {
  const response = await fetch("http://127.0.0.1:8025/api/v1/messages");
  if (response.ok) {
    console.log(
      "Local email inbox is already running at http://127.0.0.1:8025",
    );
    process.exit(0);
  }
} catch {}
const child = spawn(
  existsSync(local) ? local : "mailpit",
  ["--listen", "127.0.0.1:8025", "--smtp", "127.0.0.1:1025"],
  { windowsHide: true, detached: true, stdio: "ignore" },
);
child.on("error", () => {
  console.error(
    "Install Mailpit or start it using docker compose up -d mailpit.",
  );
  process.exitCode = 1;
});
child.on("spawn", () =>
  console.log("Local email inbox started at http://127.0.0.1:8025"),
);
child.unref();
