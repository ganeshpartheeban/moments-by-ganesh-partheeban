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
  /**
   * Visual rotation applied at display time (CSS), used for videos whose pixels
   * are stored sideways. Images are rotated in place instead (see rotateStory).
   */
  rot?: Rotation;
  meta?: StoryMeta;
};

export type Rotation = 0 | 90 | 180 | 270;

/** Optional facts shown with a story. All fields are optional and may be absent for live stories. */
export type StoryMeta = {
  /** Capture time (ISO) when it differs from the posting time. */
  shot?: string;
  /** Device the frame was made on, e.g. "Galaxy S24 Ultra". */
  cam?: string;
  /** Editing app, e.g. "Lightroom". */
  app?: string;
  /** Place name shown on the wall, e.g. "Chennai, Tamil Nadu". Set by the import or in the admin. */
  place?: string;
  lat?: number;
  lng?: number;
};

/** Max accepted size of a re-encoded frame uploaded from the admin. */
export const MAX_ROTATED_BYTES = 8 * 1024 * 1024;

/** Public shape sent to the page (no hidden items, no src). */
export type PublicStory = Pick<StoryItem, "id" | "ts" | "kind" | "w" | "h" | "caption" | "v" | "rot" | "meta">;

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

export function cleanRotation(x: unknown): Rotation | undefined {
  return x === 90 || x === 180 || x === 270 ? x : undefined;
}

/** Keep only well-typed, trimmed meta fields; returns undefined when nothing is left. */
export function cleanMeta(x: unknown): StoryMeta | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  const m: StoryMeta = {};
  const shot = str(o.shot, 30);
  const cam = str(o.cam, 60);
  const app = str(o.app, 60);
  const place = str(o.place, 100);
  if (shot) m.shot = shot;
  if (cam) m.cam = cam;
  if (app) m.app = app;
  if (place) m.place = place;
  if (typeof o.lat === "number" && typeof o.lng === "number" && Math.abs(o.lat) <= 90 && Math.abs(o.lng) <= 180) {
    m.lat = o.lat;
    m.lng = o.lng;
  }
  return Object.keys(m).length ? m : undefined;
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
      rot: cleanRotation(x.rot),
      meta: cleanMeta(x.meta),
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
    .map(({ id, ts, kind, w, h, caption, v, rot, meta }) => ({
      id,
      ts,
      kind,
      w,
      h,
      ...(caption ? { caption } : {}),
      ...(v ? { v } : {}),
      ...(rot ? { rot } : {}),
      ...(meta ? { meta } : {}),
    }));
}

/** Compact shape the admin page works with (~100 bytes each, so ~3,000 items stay near 300 KB). */
export type AdminItem = Pick<StoryItem, "id" | "ts" | "kind" | "w" | "h" | "hidden" | "v" | "rot"> & { place?: string };

export function toAdmin(items: StoryItem[]): AdminItem[] {
  return items.map(({ id, ts, kind, w, h, hidden, v, rot, meta }) => ({
    id,
    ts,
    kind,
    w,
    h,
    hidden,
    ...(v ? { v } : {}),
    ...(rot ? { rot } : {}),
    ...(meta?.place ? { place: meta.place } : {}),
  }));
}

/** Width and height as displayed, i.e. after the visual rotation. */
export const displaySize = (s: Pick<StoryItem, "w" | "h" | "rot">) =>
  s.rot === 90 || s.rot === 270 ? { w: s.h, h: s.w } : { w: s.w, h: s.h };

/**
 * Inline style that makes media fill a box of aspect `boxAspect` (width / height)
 * once rotated by `rot`. For 90/270 the element is laid out with width and height
 * swapped (as percentages of the box), then turned. Undefined when no rotation.
 */
export function rotatedFillStyle(rot: Rotation | undefined, boxAspect: number) {
  if (!rot) return undefined;
  const quarter = rot === 90 || rot === 270;
  return {
    position: "absolute" as const,
    inset: 0,
    margin: "auto",
    width: quarter ? `${(100 / boxAspect).toFixed(4)}%` : "100%",
    height: quarter ? `${(100 * boxAspect).toFixed(4)}%` : "100%",
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "cover" as const,
    transform: `rotate(${rot}deg)`,
  };
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** "YYYY-MM-DD" of the Monday that starts the Indian-time week containing `ts`. */
export function weekKey(ts: string): string {
  const d = new Date(Date.parse(ts) + IST_OFFSET_MS);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)).toISOString().slice(0, 10);
}

/** Start and end instants (IST midnight Monday, and the following Sunday) of a week key. */
export function weekRange(key: string): { start: Date; end: Date } {
  const start = new Date(`${key}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 6 * 86_400_000) };
}

/** Calendar day in IST, for "was this shot on a different day than it was posted" checks. */
export const istDay = (iso: string) => new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 10);

/** URL of the still shown in the wall (poster for videos). */
export const storyThumbUrl = (s: Pick<StoryItem, "id" | "kind" | "v">) =>
  `/stories/media/${s.id}${s.kind === "video" ? "-poster" : ""}.jpg${s.v ? `?v=${s.v}` : ""}`;
export const storyVideoUrl = (s: Pick<StoryItem, "id">) => `/stories/media/${s.id}.mp4`;

export const MEDIA_FILE_RE = /^[A-Za-z0-9_-]+?(-poster)?\.(jpg|mp4)$/;
