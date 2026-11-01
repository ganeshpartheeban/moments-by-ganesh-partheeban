import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { jpegSize, MAX_ROTATED_BYTES, toPublic, type PublicStory, type StoryItem } from "@/lib/stories-core";
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

export type AdminData = { items: StoryItem[]; storage: "r2" | "mock" | "none" };

export const getAdminStories = createServerFn({ method: "GET" })
  .inputValidator(keyValidator)
  .handler(async ({ data }): Promise<AdminData> => {
    await requireAdmin(data.key);
    const store = await getStore();
    return { items: await readIndex(store), storage: store?.kind ?? "none" };
  });

export const setStoryHidden = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const o = d as { key?: string; id?: string; hidden?: boolean };
    return {
      ...keyValidator(d),
      id: String(o?.id ?? "").slice(0, 120),
      hidden: o?.hidden === true,
    };
  })
  .handler(async ({ data }): Promise<AdminData> => {
    await requireAdmin(data.key);
    const store = await getStore();
    if (!store) throw new Error("No storage available");
    const items = await readIndex(store);
    const next = items.map((x) => (x.id === data.id ? { ...x, hidden: data.hidden } : x));
    await writeIndex(store, next);
    return { items: next, storage: store.kind };
  });

export const runCollectorNow = createServerFn({ method: "POST" })
  .inputValidator(keyValidator)
  .handler(async ({ data }): Promise<CollectResult & AdminData> => {
    const env = await requireAdmin(data.key);
    const result = await runCollector(env);
    const store = await getStore(env);
    return { ...result, items: await readIndex(store), storage: store?.kind ?? "none" };
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
    return { items: next, storage: store.kind };
  });
