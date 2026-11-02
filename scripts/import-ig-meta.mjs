#!/usr/bin/env node
/**
 * Add metadata from an Instagram "Download your information" export to stories
 * that were already imported with import-ig-archive.mjs (matched by id).
 *
 *   node scripts/import-ig-meta.mjs <export-dir> [--dry-run] [--local] [--geocode] [--captions]
 *
 * What it fills, per story (never touching media files):
 *   meta.shot   capture time from EXIF DateTimeOriginal (IST), when it differs from the post time by > 1 h
 *   meta.cam    device, derived from the firmware string Instagram keeps in "software" (Galaxy S24 Ultra, ...)
 *   meta.app    editing app (Lightroom, Snapseed, Google Photos, ...)
 *   meta.lat/lng  GPS when present (only a handful of stories carry it)
 *   meta.place  with --geocode: reverse-geocoded "City, State" via Nominatim (1 request/s). A place
 *               already set (e.g. in the admin) is never overwritten; points that resolve outside
 *               India are treated as sticker artefacts and dropped together with their lat/lng.
 *   caption     with --captions: the story's text sticker ("title"), mojibake-fixed, unless already set.
 *
 * Index access mirrors the archive importer: R2 over the S3 API when R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY and R2_ENDPOINT are set, else wrangler (`npx wrangler login`),
 * or ./.stories-mock/ with --local. Needs Node 22.18+ (imports the shared .ts helpers).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseIndex, cleanMeta } from "../src/lib/stories-core.ts";

const BUCKET = "moments-stories";
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const dryRun = flag("--dry-run");
const local = flag("--local");
const geocode = flag("--geocode");
const captions = flag("--captions");
const root = args.find((a) => !a.startsWith("--"));
if (!root || !fs.existsSync(root)) {
  console.error("Usage: import-ig-meta.mjs <unzipped-export-dir> [--dry-run] [--local] [--geocode] [--captions]");
  process.exit(1);
}

// ---- export entries, with the same ids the archive importer assigned ---------
const CANDIDATES = [
  "your_instagram_activity/content/stories.json",
  "your_instagram_activity/media/stories.json",
  "content/stories.json",
  "media/stories.json",
  "stories.json",
];
const jsonPath = CANDIDATES.map((c) => path.join(root, c)).find((p) => fs.existsSync(p));
if (!jsonPath) {
  console.error("Could not find stories.json in the export.");
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const list = Array.isArray(raw) ? raw : raw.ig_stories ?? Object.values(raw).find(Array.isArray) ?? [];
const entries = [];
for (const s of list) {
  const medias = Array.isArray(s.media) ? s.media : [s];
  for (const m of medias) {
    const uri = m.uri ?? m.media_uri;
    const ts = m.creation_timestamp ?? s.creation_timestamp ?? m.taken_at;
    if (!uri || !ts) continue;
    const mm = m.media_metadata ?? s.media_metadata ?? {};
    const exif = mm.photo_metadata?.exif_data ?? mm.video_metadata?.exif_data ?? [];
    entries.push({ uri, ts: Number(ts), exif, title: m.title ?? s.title ?? "" });
  }
}
entries.sort((a, b) => b.ts - a.ts || (a.uri < b.uri ? -1 : 1));
const usedIds = new Set();
for (const e of entries) {
  let id = `archive-${e.ts}`;
  for (let n = 2; usedIds.has(id); n++) id = `archive-${e.ts}-${n}`;
  usedIds.add(id);
  e.id = id;
}
console.log(`stories.json: ${path.relative(root, jsonPath)} (${entries.length} entries)`);

// ---- derive meta -------------------------------------------------------------
const DEVICES = [
  [/S928B/, "Galaxy S24 Ultra"],
  [/G781B/, "Galaxy S20 FE 5G"],
  [/J730GM/, "Galaxy J7 Pro"],
];
const APPS = [
  [/lightroom/i, "Lightroom"],
  [/^snapseed/i, "Snapseed"],
  [/^google/i, "Google Photos"],
  [/^retouc/i, "Retouch"],
  [/^hypocam/i, "Hypocam"],
  [/^vsco/i, "VSCO"],
  [/^picsart/i, "Picsart"],
];
const unknownSoftware = new Map();
function fromSoftware(sw) {
  if (!sw) return {};
  const dev = DEVICES.find(([re]) => re.test(sw));
  if (dev) return { cam: dev[1] };
  const app = APPS.find(([re]) => re.test(sw));
  if (app) return { app: app[1] };
  const k = sw.replace(/[\d.\s]+$/, "").trim();
  unknownSoftware.set(k, (unknownSoftware.get(k) ?? 0) + 1);
  return {};
}
/** "2026:10:19 17:28:21" (local, IST) -> ISO. */
function exifDate(v) {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(v ?? "");
  if (!m) return undefined;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
function deriveMeta(e) {
  const meta = {};
  for (const x of e.exif) {
    if (x.software) Object.assign(meta, fromSoftware(String(x.software)));
    if (x.latitude != null && x.longitude != null) {
      const lat = Number(x.latitude), lng = Number(x.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) Object.assign(meta, { lat, lng });
    }
    const shot = exifDate(x.date_time_original);
    if (shot && Math.abs(Date.parse(shot) - e.ts * 1000) > 3_600_000) meta.shot = shot;
  }
  return meta;
}
/** Instagram exports text as UTF-8 bytes read as Latin-1; undo that when it decodes cleanly. */
function fixText(t) {
  if (!/[\u0080-ÿ]/.test(t)) return t;
  const fixed = Buffer.from(t, "latin1").toString("utf8");
  return fixed.includes("�") ? t : fixed;
}
function captionFrom(title) {
  const text = fixText(String(title ?? "")).replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  // Skip titles that are only mentions, hashtags, emoji or punctuation.
  const bare = text.replace(/[@#][\w.]+/g, "").replace(/[\p{Extended_Pictographic}\p{P}\p{S}\s️‍]/gu, "");
  return bare ? text.slice(0, 200) : undefined;
}

// ---- geocoding ---------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const geoCache = new Map();
async function placeFor(lat, lng) {
  const k = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geoCache.has(k)) return geoCache.get(k);
  await sleep(1100);
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en&lat=${lat}&lon=${lng}`;
  let place;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "moments-stories-import/1.0 (ganeshpartheeban.in)" } });
    if (res.ok) {
      const a = (await res.json()).address ?? {};
      const name = a.city ?? a.town ?? a.village ?? a.suburb ?? a.municipality ?? a.county;
      // Points outside India are sticker artefacts in this export (e.g. a Mumbai bakery resolving to Brazil).
      if (a.country_code !== "in") place = null;
      else place = [name, a.state].filter(Boolean).join(", ") || undefined;
    } else console.error(`geocode ${k}: HTTP ${res.status}`);
  } catch (err) {
    console.error(`geocode ${k}: ${err.message}`);
  }
  geoCache.set(k, place);
  return place;
}

// ---- index storage -----------------------------------------------------------
const mockIdx = path.resolve(".stories-mock", "index.json");
const S3_ON = !local && !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT);
let s3 = null, S3Cmd = null;
if (S3_ON) {
  S3Cmd = await import("@aws-sdk/client-s3");
  s3 = new S3Cmd.S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
}
const wr = (a) => spawnSync("npx", ["wrangler", ...a], { encoding: "utf8" });
async function loadIndex() {
  if (local) return parseIndex(fs.existsSync(mockIdx) ? fs.readFileSync(mockIdx, "utf8") : null);
  if (S3_ON) {
    try {
      const r = await s3.send(new S3Cmd.GetObjectCommand({ Bucket: BUCKET, Key: "index.json" }));
      return parseIndex(await r.Body.transformToString());
    } catch (err) {
      if (err?.name === "NoSuchKey") return [];
      throw err;
    }
  }
  const tmp = path.join(os.tmpdir(), `stories-index-${process.pid}.json`);
  const r = wr(["r2", "object", "get", `${BUCKET}/index.json`, "--file", tmp, "--remote"]);
  if (r.status !== 0) return [];
  const text = fs.readFileSync(tmp, "utf8");
  fs.rmSync(tmp, { force: true });
  return parseIndex(text);
}
async function saveIndex(items) {
  const body = JSON.stringify(items);
  if (local) {
    fs.mkdirSync(path.dirname(mockIdx), { recursive: true });
    fs.writeFileSync(mockIdx, body);
    return true;
  }
  if (S3_ON) {
    await s3.send(new S3Cmd.PutObjectCommand({ Bucket: BUCKET, Key: "index.json", Body: body, ContentType: "application/json" }));
    return true;
  }
  const tmp = path.join(os.tmpdir(), `stories-index-${process.pid}.json`);
  fs.writeFileSync(tmp, body);
  const r = wr(["r2", "object", "put", `${BUCKET}/index.json`, "--file", tmp, "--content-type", "application/json", "--remote"]);
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0) console.error(r.stderr || r.stdout);
  return r.status === 0;
}

// ---- run ---------------------------------------------------------------------
const items = await loadIndex();
const byId = new Map(entries.map((e) => [e.id, e]));
const stats = { matched: 0, changed: 0, shot: 0, cam: 0, app: 0, gps: 0, place: 0, caption: 0, unmatched: 0 };
const samples = [];
const next = [];
for (const x of items) {
  const e = x.src === "archive" ? byId.get(x.id) : undefined;
  if (!e) {
    if (x.src === "archive") stats.unmatched++;
    next.push(x);
    continue;
  }
  stats.matched++;
  const derived = deriveMeta(e);
  const merged = { ...x.meta, ...derived };
  if (x.meta?.place) merged.place = x.meta.place;
  else if (geocode && derived.lat !== undefined) {
    const p = await placeFor(derived.lat, derived.lng);
    if (p) merged.place = p;
    else if (p === null) {
      delete merged.lat;
      delete merged.lng;
    }
  }
  const meta = cleanMeta(merged);
  const caption = captions && !x.caption ? captionFrom(e.title) : undefined;
  const y = { ...x, ...(meta ? { meta } : {}), ...(caption ? { caption } : {}) };
  if (!meta) delete y.meta;
  const changed = JSON.stringify(y) !== JSON.stringify(x);
  if (changed) {
    stats.changed++;
    if (meta?.shot) stats.shot++;
    if (meta?.cam) stats.cam++;
    if (meta?.app) stats.app++;
    if (meta?.lat !== undefined) stats.gps++;
    if (meta?.place) stats.place++;
    if (caption) stats.caption++;
    if (meta?.place || (samples.length < 8 && (caption || meta))) samples.push({ id: y.id, ts: y.ts, meta, caption });
  }
  next.push(y);
}
console.log(`matched ${stats.matched} archive stories (${stats.unmatched} not in this export); ${stats.changed} would change`);
console.log(`  shot ${stats.shot} · cam ${stats.cam} · app ${stats.app} · gps ${stats.gps} · place ${stats.place} · caption ${stats.caption}`);
if (unknownSoftware.size) console.log("  software strings not mapped:", [...unknownSoftware.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} (${n})`).join(", "));
for (const s of samples) console.log("  ", JSON.stringify(s));
if (dryRun) {
  console.log("[dry-run] index not written");
} else if (stats.changed) {
  const ok = await saveIndex(next);
  console.log(ok ? `index.json updated (${next.length} items)` : "FAILED to write index.json");
  if (!ok) process.exit(1);
} else console.log("nothing to do");
