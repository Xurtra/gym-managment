import { spawnSync } from "node:child_process";

const workbook = "gym_platform_development_only_tracker.xlsx";
const sheetXml = readZipEntry(workbook, "xl/worksheets/sheet1.xml");
const rows = [...sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => row[1]);
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

function readZipEntry(zipFile, entry) {
  const attempts = [
    ["unzip", ["-p", zipFile, entry]],
    ["tar", ["-xOf", zipFile, entry]]
  ];
  const errors = [];

  for (const [command, args] of attempts) {
    const result = spawnSync(command, args, { encoding: "utf8" });
    if (result.status === 0 && result.stdout) {
      return result.stdout;
    }
    errors.push(result.error?.message || result.stderr || `${command} exited ${result.status}`);
  }

  console.error(`Unable to read ${entry} from ${zipFile}`);
  console.error(errors.join("\n"));
  process.exit(1);
}

function text(value = "") {
  const match = value.match(/<t[^>]*>([\s\S]*?)<\/t>/) ?? value.match(/<v[^>]*>([\s\S]*?)<\/v>/);
  return decode(match?.[1] ?? "");
}

function decode(value) {
  return value
    .replaceAll("&#9744;", "☐")
    .replaceAll("&#9745;", "☑")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}
