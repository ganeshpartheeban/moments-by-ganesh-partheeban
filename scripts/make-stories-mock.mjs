// Creates .stories-mock/ with 24 9:16 JPEGs cropped from public/gallery-full.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".stories-mock");
fs.mkdirSync(path.join(root, "media"), { recursive: true });
const items = [];
const base = Date.parse("2026-10-30T12:00:00Z");
for (let n = 1; n <= 24; n++) {
  const id = `ig-mock${String(n).padStart(2, "0")}`;
  const buf = await sharp(`public/gallery-full/g${n * 2}.jpg`)
    .resize(540, 960, { fit: "cover", position: "attention" })
    .jpeg({ quality: 72 })
    .toBuffer();
  fs.writeFileSync(path.join(root, "media", `${id}.jpg`), buf);
  items.push({
    id,
    ts: new Date(base - n * 5 * 3600_000).toISOString(),
    kind: "image",
    w: 540,
    h: 960,
    hidden: false,
    src: n % 5 === 0 ? "archive" : "ig",
  });
}
fs.writeFileSync(path.join(root, "index.json"), JSON.stringify(items));
console.log(`wrote ${items.length} mock stories`);
