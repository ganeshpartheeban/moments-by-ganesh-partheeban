#!/usr/bin/env node
/**
 * Import the stories from an Instagram "Download your information" export
 * (JSON format, unzipped) into the Stories wall.
 *
 *   node scripts/import-ig-archive.mjs <export-dir> [--dry-run] [--limit N] [--local]
 *        [--hidden] [--since YYYYMM] [--until YYYYMM] [--videos]
 *
 * Without --local it uploads to R2 through wrangler (you must be logged in:
 * `npx wrangler login`). With --local it writes to ./.stories-mock/ instead.
 * --hidden   imported items start hidden (approve them later in the admin).
 * --since/--until  keep only stories whose month (UTC, from the timestamp) is in range.
 * --videos    also import mp4 stories (poster via macOS qlmanage). Off by default.
 * HEIC/HEIF are converted with macOS `sips`. Uploads run 6 at a time; Ctrl-C writes
 * the index with what was done so far; re-running skips items already in the index.
 * Needs Node 22.18+ (imports the shared .ts helpers).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, execFile } from "node:child_process";
import { promisify } from "node:util";
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
const hidden = flag("--hidden");
const withVideos = flag("--videos");
const limit = opt("--limit") ? Number(opt("--limit")) : Infinity;
const ym = (n) => {
  const v = opt(n);
  if (v === undefined) return undefined;
  if (!/^\d{6}$/.test(v)) {
    console.error(`${n} expects YYYYMM, got "${v}"`);
    process.exit(1);
  }
  return v;
};
const since = ym("--since");
const until = ym("--until");
const VALUE_FLAGS = ["--limit", "--since", "--until"];
const positional = args.filter((a, i) => !a.startsWith("--") && !VALUE_FLAGS.includes(args[i - 1]));
const root = positional[0];
if (!root || !fs.existsSync(root)) {
  console.error("Usage: import-ig-archive.mjs <unzipped-export-dir> [--dry-run] [--limit N] [--local] [--hidden] [--since YYYYMM] [--until YYYYMM] [--videos]");
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
const stats = { images: 0, videos: 0, videosSkipped: 0, missing: 0, failed: 0, existing: 0, filtered: 0 };
const execFileP = promisify(execFile);

// ---- storage helpers -------------------------------------------------------
const mockRoot = path.resolve(".stories-mock");
const wr = (a) => spawnSync("npx", ["wrangler", ...a], { encoding: "utf8" });

// Optional fast path: R2's S3-compatible API. Set R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY and R2_ENDPOINT (https://<account>.r2.cloudflarestorage.com)
// to upload directly instead of spawning wrangler per object.
const S3_ON = !local && !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT);
let s3 = null, S3Cmd = null;
if (S3_ON) {
  S3Cmd = await import("@aws-sdk/client-s3");
  s3 = new S3Cmd.S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  console.log("storage: R2 via S3 API");
}
async function s3GetText(key) {
  try {
    const r = await s3.send(new S3Cmd.GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return await r.Body.transformToString();
  } catch (e) {
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}
async function s3PutFile(key, file, type) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await s3.send(new S3Cmd.PutObjectCommand({ Bucket: BUCKET, Key: key, Body: fs.readFileSync(file), ContentType: type }));
      return true;
    } catch (e) {
      if (attempt === 3) { console.error(`[s3] put ${key} failed: ${e?.message || e}`); return false; }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return false;
}

async function loadIndex() {
  if (local) {
    const p = path.join(mockRoot, "index.json");
    return parseIndex(fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
  }
  if (S3_ON) return parseIndex(await s3GetText("index.json"));
  const tmp = path.join(os.tmpdir(), `stories-index-${process.pid}.json`);
  const r = wr(["r2", "object", "get", `${BUCKET}/index.json`, "--file", tmp, "--remote"]);
  return r.status === 0 && fs.existsSync(tmp) ? parseIndex(fs.readFileSync(tmp, "utf8")) : [];
}
async function putFile(key, file, type) {
  if (local) {
    const dest = path.join(mockRoot, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
    return true;
  }
  if (S3_ON) return s3PutFile(key, file, type);
  const r = wr(["r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", type, "--remote"]);
  if (r.status !== 0) console.error(r.stderr);
  return r.status === 0;
}

// ---- run -------------------------------------------------------------------
const CONCURRENCY = S3_ON ? 16 : 6;
const t0 = Date.now();
const existing = dryRun && !local ? [] : await loadIndex();
const have = new Set(existing.map((x) => x.id));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stories-import-"));
const added = [];
entries.sort((a, b) => b.ts - a.ts || (a.uri < b.uri ? -1 : 1));

// Ids are assigned over the whole export (before filters), so they stay stable between runs.
const usedIds = new Set();
for (const e of entries) {
  let id = `archive-${e.ts}`;
  for (let n = 2; usedIds.has(id); n++) id = `archive-${e.ts}-${n}`;
  usedIds.add(id);
  e.id = id;
}

const monthOf = (e) => {
  const m = e.uri.match(/\/(\d{6})\//);
  if (m) return m[1];
  const d = new Date(e.ts * 1000);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

// Plan the work synchronously, then run it through a small pool.
const todo = [];
for (const e of entries) {
  const mo = monthOf(e);
  if ((since && mo < since) || (until && mo > until)) {
    stats.filtered++;
    continue;
  }
  const video = isVideo(e.uri);
  if (video && !withVideos) {
    stats.videosSkipped++;
    continue;
  }
  if (!fs.existsSync(path.join(root, e.uri))) {
    stats.missing++;
    continue;
  }
  if (have.has(e.id)) {
    stats.existing++;
    continue;
  }
  if (todo.length >= limit) continue;
  todo.push({ ...e, video });
}

async function toJpeg(src, id) {
  let input = src;
  if (/\.(heic|heif)$/i.test(src)) {
    const out = path.join(tmpDir, `${id}-heic.jpg`);
    try {
      await execFileP("sips", ["-s", "format", "jpeg", src, "--out", out]);
    } catch (err) {
      if (err.code === "ENOENT") throw new Error("HEIC needs macOS `sips`, which was not found on this machine");
      throw new Error(`sips failed: ${String(err.stderr || err.message).trim()}`);
    }
    input = out;
  }
  let buf = fs.readFileSync(input);
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
  return { buf, size };
}

async function posterFor(src, id) {
  const dir = path.join(tmpDir, `ql-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  try {
    await execFileP("qlmanage", ["-t", "-s", "1080", "-o", dir, src]);
  } catch (err) {
    throw new Error(`qlmanage failed: ${String(err.stderr || err.message).trim()}`);
  }
  const png = path.join(dir, `${path.basename(src)}.png`);
  if (!fs.existsSync(png)) throw new Error("qlmanage produced no thumbnail");
  const buf = await sharp(png).rotate().jpeg({ quality: 88 }).toBuffer();
  const m = await sharp(buf).metadata();
  return { buf, size: { w: m.width, h: m.height } };
}

const upload = async (key, buf, type, id) => {
  const f = path.join(tmpDir, `${id}-${path.basename(key)}`);
  fs.writeFileSync(f, buf);
  const ok = await putFile(key, f, type);
  fs.rmSync(f, { force: true });
  if (!ok) throw new Error("upload failed");
};

let done = 0;
async function work(e) {
  const src = path.join(root, e.uri);
  try {
    let kind = "image";
    let size;
    if (e.video) {
      const p = await posterFor(src, e.id);
      size = p.size;
      if (dryRun) console.log(`[dry-run] ${e.id}  ${size.w}x${size.h}  video  ${e.uri}`);
      else {
        await upload(`media/${e.id}-poster.jpg`, p.buf, "image/jpeg", e.id);
        const f = path.join(tmpDir, `${e.id}.mp4`);
        fs.copyFileSync(src, f);
        const ok = await putFile(`media/${e.id}.mp4`, f, "video/mp4");
        fs.rmSync(f, { force: true });
        if (!ok) throw new Error("upload failed");
      }
      kind = "video";
    } else {
      const r = await toJpeg(src, e.id);
      size = r.size;
      if (dryRun) console.log(`[dry-run] ${e.id}  ${size.w}x${size.h}  ${e.uri}`);
      else await upload(`media/${e.id}.jpg`, r.buf, "image/jpeg", e.id);
    }
    added.push({ id: e.id, ts: new Date(e.ts * 1000).toISOString(), kind, w: size.w, h: size.h, hidden, src: "archive" });
    if (kind === "video") stats.videos++;
    else stats.images++;
  } catch (err) {
    stats.failed++;
    console.error(`skip ${e.uri}: ${err.message}`);
  }
  if (++done % 50 === 0) {
    const sec = (Date.now() - t0) / 1000;
    console.log(`progress ${done}/${todo.length} (${(done / sec).toFixed(1)}/s)`);
  }
}

async function writeMerged() {
  if (dryRun || !added.length) return true;
  const merged = mergeIndex(await loadIndex(), added);
  const tmpIdx = path.join(tmpDir, "index.json");
  fs.writeFileSync(tmpIdx, JSON.stringify(merged));
  if (!(await putFile("index.json", tmpIdx, "application/json"))) {
    console.error("FAILED to upload index.json; media is uploaded but not listed. Re-run to retry.");
    return false;
  }
  console.log(`index.json now has ${merged.length} items`);
  return true;
}
function summary() {
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `${dryRun ? "[dry-run] " : ""}${stats.images} images + ${stats.videos} videos ${dryRun ? "would be " : ""}imported${hidden ? " (hidden)" : ""}, ` +
      `${stats.videosSkipped} videos skipped, ${stats.existing} already present, ${stats.filtered} outside --since/--until, ` +
      `${stats.missing} missing files, ${stats.failed} failed, ${sec}s`,
  );
}

let interrupted = false;
process.on("SIGINT", () => {
  if (interrupted) process.exit(130);
  interrupted = true;
  console.log("\nInterrupted: saving progress...");
  writeMerged().then(() => { summary(); process.exit(130); }, () => process.exit(130));
});

console.log(`${todo.length} to import`);
let next = 0;
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, todo.length) }, async () => {
    while (next < todo.length) await work(todo[next++]);
  }),
);

const ok = await writeMerged();
fs.rmSync(tmpDir, { recursive: true, force: true });
summary();
if (!ok) process.exit(1);
