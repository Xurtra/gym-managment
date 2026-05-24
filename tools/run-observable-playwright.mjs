import { spawn } from "node:child_process";
import { resolve } from "node:path";

const cliPath = resolve("node_modules", "playwright", "cli.js");
const args = [cliPath, "test", ...process.argv.slice(2)];
const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    PLAYWRIGHT_OBSERVABLE: "1"
  }
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});