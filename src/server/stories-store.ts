/**
 * Storage access for the Stories pipeline.
 *
 * Production: the R2 binding `STORIES`, read through `cloudflare:workers`.
 * `npm run dev` runs in plain Node (no workerd), so there the store falls back
 * to the `.stories-mock/` folder in the repo root.
 */
import { parseIndex, type StoryItem } from "@/lib/stories-core";

export type StoriesEnv = {
  STORIES?: R2BucketLike;
  IG_USER_ID?: string;
  IG_ACCESS_TOKEN?: string;
  STORIES_ADMIN_KEY?: string;
};

// Minimal structural type so we do not depend on @cloudflare/workers-types.
type R2ObjectLike = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  text(): Promise<string>;
};
type R2BucketLike = {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: ArrayBuffer | string,
    opts?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
};

export type StoredObject = { body: BodyInit; contentType: string };

export type Store = {
  kind: "r2" | "mock";
  getText(key: string): Promise<string | null>;
  getObject(key: string): Promise<StoredObject | null>;
  put(key: string, data: ArrayBuffer | string, contentType: string): Promise<void>;
};

const DEV_KEY = "dev-key";

export async function getEnv(): Promise<StoriesEnv> {
  try {
    const m = (await import("cloudflare:workers")) as { env?: StoriesEnv };
    return m.env ?? {};
  } catch {
    return {};
  }
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  mp4: "video/mp4",
  json: "application/json",
};
const mimeFor = (key: string) => MIME[key.split(".").pop() ?? ""] ?? "application/octet-stream";

async function mockStore(): Promise<Store> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const root = path.resolve(process.cwd(), ".stories-mock");
  const full = (key: string) => {
    const p = path.resolve(root, key);
    if (!p.startsWith(root + path.sep)) throw new Error("bad key");
    return p;
  };
  return {
    kind: "mock",
    async getText(key) {
      try {
        return await fs.readFile(full(key), "utf8");
      } catch {
        return null;
      }
    },
    async getObject(key) {
      try {
        const buf = await fs.readFile(full(key));
        return { body: new Uint8Array(buf), contentType: mimeFor(key) };
      } catch {
        return null;
      }
    },
    async put(key, data) {
      const p = full(key);
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, typeof data === "string" ? data : new Uint8Array(data));
    },
  };
}

function r2Store(bucket: R2BucketLike): Store {
  return {
    kind: "r2",
    async getText(key) {
      const o = await bucket.get(key);
      return o ? o.text() : null;
    },
    async getObject(key) {
      const o = await bucket.get(key);
      return o ? { body: o.body, contentType: o.httpMetadata?.contentType ?? mimeFor(key) } : null;
    },
    async put(key, data, contentType) {
      await bucket.put(key, data, { httpMetadata: { contentType } });
    },
  };
}

/** Returns null when no storage is available (e.g. prod without the binding). */
export async function getStore(env?: StoriesEnv): Promise<Store | null> {
  const e = env ?? (await getEnv());
  if (e.STORIES) return r2Store(e.STORIES);
  if (import.meta.env.DEV) return mockStore();
  return null;
}

export async function readIndex(store: Store | null): Promise<StoryItem[]> {
  if (!store) return [];
  return parseIndex(await store.getText("index.json"));
}

export async function writeIndex(store: Store, items: StoryItem[]): Promise<void> {
  await store.put("index.json", JSON.stringify(items), "application/json");
}

/** Constant-time-ish comparison; dev falls back to "dev-key". */
export async function adminKeyOk(key: string | undefined, env?: StoriesEnv): Promise<boolean> {
  const e = env ?? (await getEnv());
  const expected = e.STORIES_ADMIN_KEY || (import.meta.env.DEV ? DEV_KEY : "");
  if (!expected || !key || key.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
