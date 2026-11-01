import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { toPublic, type PublicStory, type StoryItem } from "@/lib/stories-core";
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
