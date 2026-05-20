import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workbook = "gym_platform_development_only_tracker.xlsx";
const checkbox = {
  checked: "&#9745;",
  unchecked: "&#9744;"
};

const args = parseArgs(process.argv.slice(2));
const workbookPath = resolve(args.workbook ?? workbook);
const rows = parseRows(args.rows);
const state = statusState(args.status);
const tempDir = mkdtempSync(join(tmpdir(), "gym-tracker-"));

try {
  extractWorkbook(workbookPath, tempDir);
  const sheetPath = join(tempDir, "xl", "worksheets", "sheet1.xml");
  let sheet = readFileSync(sheetPath, "utf8");

  for (const row of rows) {
    sheet = setCell(sheet, `C${row}`, state.taken);
    sheet = setCell(sheet, `D${row}`, state.ongoing);
    sheet = setCell(sheet, `E${row}`, state.completed);
  }

  writeFileSync(sheetPath, sheet);
  archiveWorkbook(tempDir, workbookPath);
  console.log(`Updated ${rows.length} tracker row(s) to ${args.status}: ${formatRows(rows)}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--rows") {
      parsed.rows = rawArgs[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--status") {
      parsed.status = rawArgs[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--workbook") {
      parsed.workbook = rawArgs[index + 1];
      index += 1;
    }
  }
  if (!parsed.rows || !parsed.status) {
    throw new Error("Usage: node tools/update-tracker-status.mjs --rows 61-71 --status ongoing");
  }
  return parsed;
}

function parseRows(value) {
  return value.split(",").flatMap((part) => {
    const [start, end] = part.split("-").map((item) => Number.parseInt(item, 10));
    if (!Number.isInteger(start)) {
      throw new Error(`Invalid row value: ${part}`);
    }
    if (end === undefined || Number.isNaN(end)) {
      return [start];
    }
    if (end < start) {
      throw new Error(`Invalid row range: ${part}`);
    }
    return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  });
}

function statusState(status) {
  if (status === "ongoing") {
    return {
      taken: checkbox.checked,
      ongoing: checkbox.checked,
      completed: checkbox.unchecked
    };
  }
  if (status === "completed") {
    return {
      taken: checkbox.checked,
      ongoing: checkbox.unchecked,
      completed: checkbox.checked
    };
  }
  if (status === "todo") {
    return {
      taken: checkbox.unchecked,
      ongoing: checkbox.unchecked,
      completed: checkbox.unchecked
    };
  }
  throw new Error(`Unsupported status: ${status}`);
}

function setCell(sheet, cellRef, value) {
  const pattern = new RegExp(`<c[^>]*r="${cellRef}"[^>]*>[\\s\\S]*?<\\/c>`);
  if (!pattern.test(sheet)) {
    throw new Error(`Cell ${cellRef} was not found in tracker sheet.`);
  }
  return sheet.replace(pattern, `<c r="${cellRef}" s="40" t="str"><v>${value}</v></c>`);
}

function extractWorkbook(workbookPath, destination) {
  const result = spawnSync("unzip", ["-q", workbookPath, "-d", destination], {
    encoding: "utf8"
  });
  if (result.status === 0) {
    return;
  }
  const zipPath = join(destination, "tracker.zip");
  copyFileSync(workbookPath, zipPath);
  runPowerShell(
    "Expand-Archive -LiteralPath {0} -DestinationPath {1} -Force",
    zipPath,
    destination
  );
  rmSync(zipPath, { force: true });
}

function archiveWorkbook(sourceDir, workbookPath) {
  const result = spawnSync("zip", ["-qr", workbookPath, "."], {
    cwd: sourceDir,
    encoding: "utf8"
  });
  if (result.status === 0) {
    return;
  }
  runPowerShell(
    [
      "if (Test-Path -LiteralPath {1}) { Remove-Item -LiteralPath {1} -Force }",
      "Compress-Archive -Path (Join-Path {0} '*') -DestinationPath {2} -Force",
      "Move-Item -LiteralPath {2} -Destination {1} -Force"
    ].join("; "),
    sourceDir,
    workbookPath,
    `${workbookPath}.zip`
  );
}

function runPowerShell(command, ...args) {
  const script = args.reduce(
    (next, arg, index) => next.replaceAll(`{${index}}`, `'${String(arg).replaceAll("'", "''")}'`),
    command
  );
  const result = spawnSync("powershell", ["-NoProfile", "-Command", script], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `PowerShell archive command failed with status ${result.status}`);
  }
}

function formatRows(rows) {
  if (rows.length <= 6) {
    return rows.join(", ");
  }
  return `${rows[0]}-${rows.at(-1)}`;
}
