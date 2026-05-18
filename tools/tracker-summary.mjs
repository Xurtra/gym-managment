import { spawnSync } from "node:child_process";

const workbook = "gym_platform_development_only_tracker.xlsx";
const result = spawnSync("unzip", ["-p", workbook, "xl/worksheets/sheet1.xml"], {
  encoding: "utf8"
});

if (result.status !== 0) {
  console.error(result.stderr || `Unable to read ${workbook}`);
  process.exit(result.status ?? 1);
}

const rows = [...result.stdout.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => row[1]);
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
  if (cells.C === "☑") statuses.taken += 1;
  if (cells.D === "☑") statuses.ongoing += 1;
  if (cells.E === "☑") statuses.completed += 1;
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
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}
