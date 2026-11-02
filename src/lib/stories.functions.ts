import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import {
  applyPatch,
  jpegSize,
  MAX_NOTE_LEN,
  MAX_PLACE_LEN,
  MAX_ROTATED_BYTES,
  sortIndex,
  toAdmin,
  toPublic,
  type AdminItem,
  type PublicStory,
  type Rotation,
  type StoryPatch,
} from "@/lib/stories-core";
import { adminKeyOk, getEnv, getStore, readIndex, writeIndex } from "@/server/stories-store";
import { runCollector, type CollectResult } from "@/server/stories-collector";

/** Visible stories, newest first. Never throws: a broken bucket renders an empty wall. */
async function loadPublicStories(): Promise<PublicStory[]> {
  try {
    return toPublic(await readIndex(await getStore()));
  } catch (err) {
    console.error("[stories] index read failed", err);
    return [];
  }
}

export const getStories = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicStory[]> => loadPublicStories(),
);

type KeyInput = { key?: string };
const keyValidator = (d: unknown): KeyInput => {
  const key = (d as KeyInput | undefined)?.key;
  return { key: typeof key === "string" ? key.slice(0, 200) : undefined };
};

async function requireAdmin(key: string | undefined) {
  const env = await getEnv();
  if (!(await adminKeyOk(key, env))) throw notFound();
  return env;
}

export type AdminData = { items: AdminItem[]; storage: "r2" | "mock" | "none" };

export const getAdminStories = createServerFn({ method: "GET" })
  .inputValidator(keyValidator)
  .handler(async ({ data }): Promise<AdminData> => {
    await requireAdmin(data.key);
    const store = await getStore();
    return { items: toAdmin(await readIndex(store)), storage: store?.kind ?? "none" };
  });

/**
 * Change one or many stories at once: visibility, posting time, capture time,
 * device, place, note and visual rotation. Omitted fields are left alone; an
 * empty string clears a text field. Media files are untouched.
 */
export const updateStories = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const o = d as { ids?: unknown; patch?: Record<string, unknown> };
    const ids = Array.isArray(o?.ids)
      ? [...new Set(o.ids.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 120)))].slice(0, 5000)
      : [];
    const p = o?.patch ?? {};
    const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : undefined);
    const iso = (v: unknown) => {
      if (typeof v !== "string") return undefined;
      if (v === "") return "";
      const t = Date.parse(v);
      return Number.isNaN(t) ? undefined : new Date(t).toISOString();
    };
    const patch: StoryPatch = {};
    if (typeof p.hidden === "boolean") patch.hidden = p.hidden;
    const ts = iso(p.ts);
    if (ts) patch.ts = ts;
    const shot = iso(p.shot);
    if (shot !== undefined) patch.shot = shot;
    const cam = text(p.cam, 60);
    if (cam !== undefined) patch.cam = cam;
    const place = text(p.place, MAX_PLACE_LEN);
    if (place !== undefined) patch.place = place;
    const note = text(p.note, MAX_NOTE_LEN);
    if (note !== undefined) patch.note = note;
    const r = Number(p.rot);
    if (p.rot !== undefined && (r === 0 || r === 90 || r === 180 || r === 270)) patch.rot = r as Rotation;
    return { ...keyValidator(d), ids, patch };
  })
  .handler(async ({ data }): Promise<AdminData & { changed: number }> => {
    await requireAdmin(data.key);
    const store = await getStore();
    if (!store) throw new Error("No storage available");
    const ids = new Set(data.ids);
    let changed = 0;
    let next = (await readIndex(store)).map((x) => {
      if (!ids.has(x.id)) return x;
      const y = applyPatch(x, data.patch);
      if (y !== x) changed++;
      return y;
    });
    if (changed) {
      if (data.patch.ts) next = sortIndex(next);
      await writeIndex(store, next);
    }
    return { changed, items: toAdmin(next), storage: store.kind };
  });

export const runCollectorNow = createServerFn({ method: "POST" })
  .inputValidator(keyValidator)
  .handler(async ({ data }): Promise<CollectResult & AdminData> => {
    const env = await requireAdmin(data.key);
    const result = await runCollector(env);
    const store = await getStore(env);
    return { ...result, items: toAdmin(await readIndex(store)), storage: store?.kind ?? "none" };
  });

/**
 * Overwrite media/<id>.jpg with a frame the admin's browser already rotated.
 * Payload is FormData: key, id, dir ("left" | "right", informational), file (JPEG blob).
 */
export const rotateStory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Expected FormData");
    const key = d.get("key");
    const file = d.get("file");
    if (!(file instanceof Blob)) throw new Error("Missing file");
    return {
      key: typeof key === "string" ? key.slice(0, 200) : undefined,
      id: String(d.get("id") ?? "").slice(0, 120),
      dir: d.get("dir") === "left" ? ("left" as const) : ("right" as const),
      file,
    };
  })
  .handler(async ({ data }): Promise<AdminData> => {
    await requireAdmin(data.key);
    const store = await getStore();
    if (!store) throw new Error("No storage available");
    const items = await readIndex(store);
    const item = items.find((x) => x.id === data.id);
    if (!item) throw new Error("Unknown story");
    if (data.file.size > MAX_ROTATED_BYTES) throw new Error("Image is over 8 MB");
    const buf = await data.file.arrayBuffer();
    const dims = jpegSize(new Uint8Array(buf));
    if (!dims) throw new Error("Not a JPEG");
    await store.put(`media/${item.id}.jpg`, buf, "image/jpeg");
    const next = items.map((x) =>
      x.id === item.id ? { ...x, w: dims.w, h: dims.h, v: (x.v ?? 0) + 1 } : x,
    );
    await writeIndex(store, next);
    return { items: toAdmin(next), storage: store.kind };
  });
