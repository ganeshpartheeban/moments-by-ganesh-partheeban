/**
 * Pure helpers for the Stories wall. No imports, no runtime APIs, so they run
 * in the Worker, in Node scripts and in tests alike.
 */

export type StoryItem = {
  id: string;
  /** ISO timestamp of when the story was posted. */
  ts: string;
  kind: "image" | "video";
  w: number;
  h: number;
  hidden: boolean;
  src: "ig" | "archive";
  caption?: string;
  /** Bumped on every rotation; appended to media URLs to bypass the immutable cache. */
  v?: number;
};

/** Max accepted size of a re-encoded frame uploaded from the admin. */
export const MAX_ROTATED_BYTES = 8 * 1024 * 1024;

/** Public shape sent to the page (no hidden items, no src). */
export type PublicStory = Pick<StoryItem, "id" | "ts" | "kind" | "w" | "h" | "caption" | "v">;

/**
 * Read width/height from a JPEG by walking marker segments to the first SOF.
 * Returns null when the buffer is not a JPEG or the header is truncated.
 */
export function jpegSize(bytes: Uint8Array): { w: number; h: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 8 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    let marker = bytes[i + 1];
    // Skip fill bytes (0xFF 0xFF ...).
    while (marker === 0xff && i + 2 < bytes.length) {
      i++;
      marker = bytes[i + 1];
    }
    // Standalone markers have no length: TEM, RSTn, SOI, EOI.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC).
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      const h = (bytes[i + 5] << 8) | bytes[i + 6];
      const w = (bytes[i + 7] << 8) | bytes[i + 8];
      return w > 0 && h > 0 ? { w, h } : null;
    }
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

/** Normalise Graph timestamps ("2024-05-01T10:00:00+0000") to ISO-8601 Z. */
export function normalizeTs(raw: string | number | undefined): string {
  if (typeof raw === "number") return new Date(raw * (raw < 1e12 ? 1000 : 1)).toISOString();
  if (!raw) return new Date().toISOString();
  const fixed = raw.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const d = new Date(fixed);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function validItem(x: unknown): x is StoryItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.ts === "string" &&
    (o.kind === "image" || o.kind === "video") &&
    typeof o.w === "number" &&
    typeof o.h === "number"
  );
}

/** Parse index.json text defensively. Bad input yields an empty list. */
export function parseIndex(text: string | null): StoryItem[] {
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return data.filter(validItem).map((x) => ({
      ...x,
      hidden: x.hidden === true,
      v: typeof x.v === "number" && x.v > 0 ? x.v : undefined,
      src: x.src === "archive" ? "archive" : "ig",
    }));
  } catch {
    return [];
  }
}

/**
 * Merge incoming items into the existing index. Existing ids always win
 * (so a curated `hidden` flag is never reset), the result is newest first.
 */
export function mergeIndex(existing: StoryItem[], incoming: StoryItem[]): StoryItem[] {
  const seen = new Set(existing.map((x) => x.id));
  const out = [...existing];
  for (const it of incoming) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : a.id < b.id ? 1 : -1));
}

export function toPublic(items: StoryItem[]): PublicStory[] {
  return items
    .filter((x) => !x.hidden)
    .map(({ id, ts, kind, w, h, caption, v }) => ({
      id,
      ts,
      kind,
      w,
      h,
      ...(caption ? { caption } : {}),
      ...(v ? { v } : {}),
    }));
}

/** URL of the still shown in the wall (poster for videos). */
export const storyThumbUrl = (s: Pick<StoryItem, "id" | "kind" | "v">) =>
  `/stories/media/${s.id}${s.kind === "video" ? "-poster" : ""}.jpg${s.v ? `?v=${s.v}` : ""}`;
export const storyVideoUrl = (s: Pick<StoryItem, "id">) => `/stories/media/${s.id}.mp4`;

export const MEDIA_FILE_RE = /^[A-Za-z0-9_-]+?(-poster)?\.(jpg|mp4)$/;
