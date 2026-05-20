import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workbook = "gym_platform_development_only_tracker.xlsx";
const sheet = readWorksheet(workbook, "xl/worksheets/sheet1.xml");

const rows = [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => row[1]);
const counts = new Map();
const statuses = { taken: 0, ongoing: 0, completed: 0 };

for (const row of rows) {
  const cells = Object.fromEntries(
    [...row.matchAll(/<c[^>]*r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g)].map((cell) => [
      cell[1],
      text(cell[2])
    ])
  );
  if (
    !cells.A ||
    !cells.B ||
    cells.A === "Job" ||
    cells.A === "Gym Platform Development Build Tracker"
  ) {
    continue;
  }
  counts.set(cells.A, (counts.get(cells.A) ?? 0) + 1);
  if (isChecked(cells.C)) statuses.taken += 1;
  if (isChecked(cells.D)) statuses.ongoing += 1;
  if (isChecked(cells.E)) statuses.completed += 1;
}

console.log("Tracker summary");
console.log(`Taken: ${statuses.taken}`);
console.log(`Ongoing: ${statuses.ongoing}`);
console.log(`Completed: ${statuses.completed}`);
console.log("");
for (const [job, count] of counts) {
  console.log(`${job}: ${count}`);
}

function text(value = "") {
  const match = value.match(/<t[^>]*>([\s\S]*?)<\/t>/) ?? value.match(/<v[^>]*>([\s\S]*?)<\/v>/);
  return decode(match?.[1] ?? "");
}

function decode(value) {
  return value
    .replaceAll("&#9745;", "☑")
    .replaceAll("&#9744;", "☐")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function isChecked(value) {
  return value === "☑" || value === "â˜‘";
}

function readWorksheet(workbookPath, entryPath) {
  const unzipResult = spawnSync("unzip", ["-p", workbookPath, entryPath], {
    encoding: "utf8"
  });
  if (unzipResult.status === 0) {
    return unzipResult.stdout;
  }

  const tempDir = mkdtempSync(join(tmpdir(), "gym-tracker-summary-"));
  try {
    const resolvedWorkbook = resolve(workbookPath);
    const zipPath = join(tempDir, "tracker.zip");
    copyFileSync(resolvedWorkbook, zipPath);
    const expandResult = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        archiveCommand(
          "Expand-Archive -LiteralPath {0} -DestinationPath {1} -Force",
          zipPath,
          tempDir
        )
      ],
      { encoding: "utf8" }
    );
    if (expandResult.status !== 0) {
      throw new Error(expandResult.stderr || `Unable to read ${workbookPath}`);
    }
    return readFileSync(join(tempDir, ...entryPath.split("/")), "utf8");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function archiveCommand(command, ...args) {
  return args.reduce(
    (next, arg, index) => next.replace(`{${index}}`, `'${String(arg).replaceAll("'", "''")}'`),
    command
  );
}
