import { execFileSync, spawn } from "node:child_process";

const processes = new Map();
const ports = [4000, 5173];

function terminateChildProcess(child) {
  if (child.killed || child.pid == null) {
    return;
  }

  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    } catch {
      // Fall back to the standard signal if taskkill fails.
    }
  }

  child.kill();
}

function getListeningPid(port) {
  try {
    const output = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `$conn = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($conn) { $conn.OwningProcess }`
      ],
      { encoding: "utf8" }
    ).trim();
    const pid = Number.parseInt(output, 10);
    return Number.isFinite(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

function stopProcess(pid, port) {
  try {
    execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
    process.stdout.write(`[dev] cleared existing listener on port ${port} (pid ${pid})\n`);
  } catch {
    process.stdout.write(`[dev] port ${port} is already in use and could not be cleared automatically\n`);
  }
}

for (const port of ports) {
  const pid = getListeningPid(port);
  if (pid) {
    stopProcess(pid, port);
  }
}

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });

  processes.set(name, child);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on("exit", (code, signal) => {
    processes.delete(name);
    if (signal) {
      process.stdout.write(`[${name}] exited with signal ${signal}\n`);
    } else {
      process.stdout.write(`[${name}] exited with code ${code ?? 0}\n`);
    }
    if (processes.size > 0) {
      shutdown(code ?? 0);
    }
  });

  return child;
}

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of processes.values()) {
    terminateChildProcess(child);
  }

  globalThis.setTimeout(() => process.exit(code), 500).unref?.();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("api", "npm", ["run", "dev", "-w", "@gym-platform/api"]);
start("frontend", "npm", ["run", "dev", "-w", "@gym-platform/frontend"]);
