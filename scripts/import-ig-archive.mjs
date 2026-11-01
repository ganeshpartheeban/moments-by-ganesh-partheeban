#!/usr/bin/env node
/**
 * Import the stories from an Instagram "Download your information" export
 * (JSON format, unzipped) into the Stories wall.
 *
 *   node scripts/import-ig-archive.mjs <export-dir> [--dry-run] [--limit N] [--local]
 *
 * Without --local it uploads to R2 through wrangler (you must be logged in:
 * `npx wrangler login`). With --local it writes to ./.stories-mock/ instead.
 * Images only: videos are skipped (counted) because a poster frame cannot be
 * derived without ffmpeg. Needs Node 22.18+ (imports the shared .ts helpers).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { mergeIndex, parseIndex, jpegSize } from "../src/lib/stories-core.ts";

const BUCKET = "moments-stories";
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag("--dry-run");
const local = flag("--local");
const limit = opt("--limit") ? Number(opt("--limit")) : Infinity;
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--limit");
const root = positional[0];
if (!root || !fs.existsSync(root)) {
  console.error("Usage: import-ig-archive.mjs <unzipped-export-dir> [--dry-run] [--limit N] [--local]");
  process.exit(1);
}

// ---- locate stories.json --------------------------------------------------
const CANDIDATES = [
  "your_instagram_activity/content/stories.json",
  "your_instagram_activity/media/stories.json",
  "content/stories.json",
  "media/stories.json",
  "stories.json",
];
function findStoriesJson() {
  for (const c of CANDIDATES) {
    const p = path.join(root, c);
    if (fs.existsSync(p)) return p;
  }
  // Fallback: walk (depth-limited) for any stories.json.
  const walk = (dir, depth) => {
    if (depth > 4) return null;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isFile() && e.name === "stories.json") return p;
      if (e.isDirectory()) {
        const r = walk(p, depth + 1);
        if (r) return r;
      }
    }
    return null;
  };
  return walk(root, 0);
}
const jsonPath = findStoriesJson();
if (!jsonPath) {
  console.error("Could not find stories.json in the export (looked in content/ and your_instagram_activity/).");
  process.exit(1);
}

// ---- parse entries ---------------------------------------------------------
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const list = Array.isArray(raw) ? raw : raw.ig_stories ?? Object.values(raw).find(Array.isArray) ?? [];
const entries = [];
for (const s of list) {
  // Older exports: {uri, creation_timestamp}. Newer: {media:[{uri,creation_timestamp}]} or string_map_data.
  const medias = Array.isArray(s.media) ? s.media : [s];
  for (const m of medias) {
    const uri = m.uri ?? m.media_uri;
    const ts = m.creation_timestamp ?? s.creation_timestamp ?? m.taken_at;
    if (uri && ts) entries.push({ uri, ts: Number(ts) });
  }
}
console.log(`stories.json: ${path.relative(root, jsonPath)} (${entries.length} entries)`);

const isVideo = (u) => /\.(mp4|mov|m4v|webm)$/i.test(u);
const stats = { images: 0, videosSkipped: 0, missing: 0, failed: 0, existing: 0 };

// ---- storage helpers -------------------------------------------------------
const mockRoot = path.resolve(".stories-mock");
const wr = (a) => spawnSync("npx", ["wrangler", ...a], { encoding: "utf8" });

function loadIndex() {
  if (local) {
    const p = path.join(mockRoot, "index.json");
    return parseIndex(fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
  }
  const tmp = path.join(os.tmpdir(), `stories-index-${process.pid}.json`);
  const r = wr(["r2", "object", "get", `${BUCKET}/index.json`, "--file", tmp, "--remote"]);
  return r.status === 0 && fs.existsSync(tmp) ? parseIndex(fs.readFileSync(tmp, "utf8")) : [];
}
function putFile(key, file, type) {
  if (local) {
    const dest = path.join(mockRoot, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
    return true;
  }
  const r = wr(["r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", type, "--remote"]);
  if (r.status !== 0) console.error(r.stderr);
  return r.status === 0;
}

// ---- run -------------------------------------------------------------------
const existing = dryRun && !local ? [] : loadIndex();
const have = new Set(existing.map((x) => x.id));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stories-import-"));
const added = [];
entries.sort((a, b) => b.ts - a.ts);

for (const e of entries) {
  if (added.length >= limit) break;
  if (isVideo(e.uri)) {
    stats.videosSkipped++;
    continue;
  }
  const src = path.join(root, e.uri);
  if (!fs.existsSync(src)) {
    stats.missing++;
    continue;
  }
  let id = `archive-${e.ts}`;
  for (let n = 2; added.some((a) => a.id === id); n++) id = `archive-${e.ts}-${n}`;
  if (have.has(id)) {
    stats.existing++;
    continue;
  }
  try {
    let buf = fs.readFileSync(src);
    let size = jpegSize(new Uint8Array(buf));
    if (!size) {
      buf = await sharp(buf).rotate().jpeg({ quality: 88 }).toBuffer();
      const m = await sharp(buf).metadata();
      size = { w: m.width, h: m.height };
    } else {
      // Honour EXIF rotation only when sharp says it swaps axes.
      const m = await sharp(buf).metadata();
      if (m.orientation && m.orientation >= 5) {
        buf = await sharp(buf).rotate().jpeg({ quality: 90 }).toBuffer();
        size = { w: m.height, h: m.width };
      } else if (m.width && m.height) size = { w: m.width, h: m.height };
    }
    if (dryRun) {
      console.log(`[dry-run] ${id}  ${size.w}x${size.h}  ${e.uri}`);
    } else {
      const tmpFile = path.join(tmpDir, `${id}.jpg`);
      fs.writeFileSync(tmpFile, buf);
      if (!putFile(`media/${id}.jpg`, tmpFile, "image/jpeg")) throw new Error("upload failed");
      console.log(`uploaded ${id}`);
    }
    added.push({ id, ts: new Date(e.ts * 1000).toISOString(), kind: "image", w: size.w, h: size.h, hidden: false, src: "archive" });
    stats.images++;
  } catch (err) {
    stats.failed++;
    console.error(`skip ${e.uri}: ${err.message}`);
  }
}

if (!dryRun && added.length) {
  const merged = mergeIndex(loadIndex(), added);
  const tmpIdx = path.join(tmpDir, "index.json");
  fs.writeFileSync(tmpIdx, JSON.stringify(merged));
  if (!putFile("index.json", tmpIdx, "application/json")) {
    console.error("FAILED to upload index.json; media is uploaded but not listed. Re-run to retry.");
    process.exit(1);
  }
  console.log(`index.json now has ${merged.length} items`);
}
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(
  `${dryRun ? "[dry-run] " : ""}${stats.images} images ${dryRun ? "would be " : ""}imported, ` +
    `${stats.videosSkipped} videos skipped, ${stats.existing} already present, ${stats.missing} missing files, ${stats.failed} failed`,
);
