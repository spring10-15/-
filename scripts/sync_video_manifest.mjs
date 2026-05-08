import { readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const videoDir = path.join(repoRoot, "assets", "videos");
const manifestPath = path.join(videoDir, "manifest.json");

const knownVideos = {
  menu: "menu-title-bg",
  stash: "stash-loop",
  "tavern-smoky-den": "tavern-smoky-den-bg",
  "tavern-high-rise-suite": "tavern-high-rise-suite-bg",
  "tavern-rooftop-club": "tavern-rooftop-club-bg",
  "tavern-neon-poker-club": "tavern-neon-poker-club-bg",
  "poker-table-normal": "poker-table-normal",
  "poker-table-highstakes": "poker-table-highstakes",
  "poker-table-allin": "poker-table-allin",
  "poker-table-showdown": "poker-table-showdown",
  "extraction-success": "extraction-success",
  "extraction-failure": "extraction-failure",
};

const supportedExtensions = new Set([".webm", ".mp4"]);
const files = await readdir(videoDir).catch(() => []);
const filesByStem = new Map();
files
  .filter((file) => supportedExtensions.has(path.extname(file).toLowerCase()))
  .forEach((file) => {
    const stem = path.basename(file, path.extname(file));
    const current = filesByStem.get(stem);
    if (!current || path.extname(file).toLowerCase() === ".webm") {
      filesByStem.set(stem, file);
    }
  });

const available = Object.entries(knownVideos)
  .filter(([, stem]) => filesByStem.has(stem))
  .map(([key]) => key);
const manifestFiles = Object.fromEntries(
  Object.entries(knownVideos)
    .filter(([key, stem]) => available.includes(key) && filesByStem.has(stem))
    .map(([key, stem]) => [key, filesByStem.get(stem)]),
);

const manifest = {
  enabled: available.length > 0,
  available,
  files: manifestFiles,
  updatedAt: new Date().toISOString(),
};

await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await rename(`${manifestPath}.tmp`, manifestPath);

console.log(JSON.stringify(manifest, null, 2));
