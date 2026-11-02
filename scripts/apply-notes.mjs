#!/usr/bin/env node
/**
 * Set the note (caption) of many stories at once from a JSON file: { "<id>": "note", ... }.
 *
 *   node scripts/apply-notes.mjs <notes.json> [--dry-run] [--local] [--replace]
 *
 * By default only stories without a note receive one; --replace also overwrites existing notes.
 * Notes are trimmed and capped at MAX_NOTE_LEN; an empty string clears the note (with --replace).
 * Index access mirrors import-ig-meta.mjs: R2 over the S3 API when R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY and R2_ENDPOINT are set, else wrangler (`npx wrangler login`),
 * or ./.stories-mock/ with --local. Needs Node 22.18+ (imports the shared .ts helpers).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseIndex, MAX_NOTE_LEN } from "../src/lib/stories-core.ts";

const BUCKET = "moments-stories";
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const dryRun = flag("--dry-run");
const local = flag("--local");
const replace = flag("--replace");
const file = args.find((a) => !a.startsWith("--"));
if (!file || !fs.existsSync(file)) {
  console.error("Usage: apply-notes.mjs <notes.json> [--dry-run] [--local] [--replace]");
  process.exit(1);
}
const notes = JSON.parse(fs.readFileSync(file, "utf8"));
if (!notes || typeof notes !== "object" || Array.isArray(notes)) {
  console.error("notes.json must be an object of id -> note");
  process.exit(1);
}

// ---- index storage (same as import-ig-meta.mjs) --------------------------------
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

// ---- run ----------------------------------------------------------------------
const items = await loadIndex();
const stats = { inFile: Object.keys(notes).length, matched: 0, set: 0, replaced: 0, cleared: 0, keptExisting: 0, unchanged: 0, unknownIds: 0 };
const known = new Set(items.map((x) => x.id));
for (const id of Object.keys(notes)) if (!known.has(id)) stats.unknownIds++;
const next = items.map((x) => {
  if (!(x.id in notes)) return x;
  stats.matched++;
  const raw = notes[x.id];
  const note = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, MAX_NOTE_LEN) : "";
  if (x.caption && !replace) { stats.keptExisting++; return x; }
  if ((x.caption ?? "") === note) { stats.unchanged++; return x; }
  const y = { ...x };
  if (note) { if (x.caption) stats.replaced++; else stats.set++; y.caption = note; }
  else { stats.cleared++; delete y.caption; }
  return y;
});
console.log(`notes in file ${stats.inFile} · matched ${stats.matched} · unknown ids ${stats.unknownIds}`);
console.log(`  set ${stats.set} · replaced ${stats.replaced} · cleared ${stats.cleared} · kept existing ${stats.keptExisting} · unchanged ${stats.unchanged}`);
const changed = stats.set + stats.replaced + stats.cleared;
if (dryRun) console.log("[dry-run] index not written");
else if (!changed) console.log("nothing to write");
else console.log((await saveIndex(next)) ? `index written (${changed} notes)` : "write failed");
