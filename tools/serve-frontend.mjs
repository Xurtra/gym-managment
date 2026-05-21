import { spawn } from "node:child_process";

const port = process.env.PORT || "4173";
const child = spawn(
  "npm",
  ["run", "preview", "-w", "@gym-platform/frontend", "--", "--host", "0.0.0.0", "--port", port],
  { stdio: "inherit", shell: process.platform === "win32" }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
