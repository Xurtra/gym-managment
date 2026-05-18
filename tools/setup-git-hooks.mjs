import { spawnSync } from "node:child_process";

const isGitRepo = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  stdio: "ignore"
}).status === 0;

if (!isGitRepo) {
  console.log("Git hooks not installed because this directory is not currently a Git repository.");
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Git hooks configured to use .githooks.");
