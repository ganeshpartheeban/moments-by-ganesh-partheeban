// Generate per-story Open Graph images (1200×630) from each case study's cover.
// Run: node scripts/generate-og.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "og");
const SRC_DIR = path.join(ROOT, "src", "assets");

// Mirror of src/lib/case-studies.ts — keep slug + cover in sync.
const STORIES = [
  { slug: "mevlin-nikhil", cover: 1 },
  { slug: "swati-sushin", cover: 9 },
  { slug: "bhavana-jayanth", cover: 11 },
  { slug: "theyyam-kannur", cover: 5 },
  { slug: "agam-bengaluru", cover: 2 },
  { slug: "concerts-chennai", cover: 30 },
];

function findSource(n) {
  for (const ext of ["jpg", "JPG", "jpeg", "JPEG"]) {
    const p = path.join(SRC_DIR, `gallery-${n}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

await mkdir(OUT_DIR, { recursive: true });

for (const { slug, cover } of STORIES) {
  const src = findSource(cover);
  if (!src) {
    console.warn(`skip ${slug}: source for cover ${cover} not found`);
    continue;
  }
  const out = path.join(OUT_DIR, `${slug}.jpg`);
  await sharp(src)
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log(`wrote ${out}`);
}
