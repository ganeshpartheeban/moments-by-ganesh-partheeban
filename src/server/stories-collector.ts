/**
 * Hourly collector: pulls the live Instagram stories into R2.
 *
 * Budget (free plan: 50 subrequests per invocation): 1 token refresh (rare) +
 * 1 story list + at most 2 media fetches per story. We stop starting new
 * stories once the budget is spent; leftovers are picked up next hour, as
 * long as they are still live (stories expire after 24 h).
 *
 * index.json is written once, last, so a partial failure never corrupts it.
 */
import {
  jpegSize,
  mergeIndex,
  normalizeTs,
  type StoryItem,
} from "@/lib/stories-core";
import { getStore, readIndex, writeIndex, type Store, type StoriesEnv } from "./stories-store";

// Graph host. System-user / Facebook-login tokens ("EAA...") only work on
// graph.facebook.com and never expire; Instagram-login tokens ("IG...") use
// graph.instagram.com and must be refreshed every ~60 days.
function graphHost(env: StoriesEnv): string {
  if (env.IG_GRAPH_HOST) return env.IG_GRAPH_HOST.replace(/\/$/, "");
  return isInstagramLoginToken(env.IG_ACCESS_TOKEN) ? "https://graph.instagram.com" : "https://graph.facebook.com";
}
function isInstagramLoginToken(token?: string): boolean {
  return typeof token === "string" && token.startsWith("IG");
}
const MAX_NEW_PER_RUN = 20;
const SUBREQUEST_BUDGET = 44; // leave headroom under 50
const DAY = 86_400_000;
const TOKEN_LIFE_DAYS = 60;
const REFRESH_AFTER_DAYS = 45;

type TokenFile = { access_token: string; expires_at: number };
type GraphStory = {
  id: string;
  media_type?: "IMAGE" | "VIDEO" | string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  permalink?: string;
};

export type CollectResult = {
  ok: boolean;
  added: number;
  skipped: number;
  failed: number;
  message: string;
};

function parseToken(text: string | null): TokenFile | null {
  if (!text) return null;
  try {
    const t = JSON.parse(text) as Partial<TokenFile>;
    if (typeof t.access_token === "string" && typeof t.expires_at === "number") {
      return { access_token: t.access_token, expires_at: t.expires_at };
    }
  } catch {
    /* fall through */
  }
  return null;
}

async function graphJson(url: string): Promise<{ status: number; data: any }> {
  const res = await fetch(url);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, data };
}

function graphError(label: string, status: number, data: any): string {
  const e = data?.error;
  const code = e?.code;
  const hint =
    code === 190 || status === 401
      ? " TOKEN EXPIRED OR INVALID: generate a new token in the Meta app dashboard and run `npx wrangler secret put IG_ACCESS_TOKEN`, then delete token.json from the bucket."
      : "";
  return `${label} failed (HTTP ${status}${code ? `, code ${code}` : ""}): ${e?.message ?? "unknown error"}.${hint}`;
}

async function ensureToken(
  store: Store,
  env: StoriesEnv,
  now: number,
  sub: { n: number },
): Promise<string | null> {
  let token = parseToken(await store.getText("token.json"));
  if (!token) {
    if (!env.IG_ACCESS_TOKEN) return null;
    // Bootstrap: we cannot know the real age of a pasted token, assume fresh.
    token = { access_token: env.IG_ACCESS_TOKEN, expires_at: now + TOKEN_LIFE_DAYS * DAY };
    await store.put("token.json", JSON.stringify(token), "application/json");
  }
  // Non-Instagram-login tokens (system user) never expire: nothing to refresh.
  if (!isInstagramLoginToken(token.access_token)) return token.access_token;
  const ageDays = TOKEN_LIFE_DAYS - (token.expires_at - now) / DAY;
  if (ageDays >= REFRESH_AFTER_DAYS) {
    sub.n++;
    const { status, data } = await graphJson(
      `${graphHost(env)}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token.access_token)}`,
    );
    if (status === 200 && data?.access_token) {
      const expiresIn = Number(data.expires_in) || TOKEN_LIFE_DAYS * 86_400;
      token = { access_token: data.access_token, expires_at: now + expiresIn * 1000 };
      await store.put("token.json", JSON.stringify(token), "application/json");
      console.log(`[stories] token refreshed, valid ${Math.round(expiresIn / 86_400)} days`);
    } else {
      // Keep using the old token while it still works; surface loudly.
      console.error("[stories] " + graphError("token refresh", status, data));
    }
  }
  return token.access_token;
}

async function fetchBytes(url: string, sub: { n: number }): Promise<{ buf: ArrayBuffer; type: string } | null> {
  sub.n++;
  const res = await fetch(url);
  if (!res.ok) return null;
  return { buf: await res.arrayBuffer(), type: res.headers.get("content-type") ?? "" };
}

export async function runCollector(envIn?: StoriesEnv): Promise<CollectResult> {
  const store = await getStore(envIn);
  const env = envIn ?? (await (await import("./stories-store")).getEnv());
  if (!store) return { ok: false, added: 0, skipped: 0, failed: 0, message: "No storage: STORIES R2 binding missing." };
  if (!env.IG_USER_ID) return { ok: false, added: 0, skipped: 0, failed: 0, message: "IG_USER_ID secret is not set." };

  const now = Date.now();
  const sub = { n: 0 };
  const accessToken = await ensureToken(store, env, now, sub);
  if (!accessToken) return { ok: false, added: 0, skipped: 0, failed: 0, message: "No Instagram token (set IG_ACCESS_TOKEN)." };

  sub.n++;
  const fields = "id,media_type,media_url,thumbnail_url,timestamp,permalink";
  const { status, data } = await graphJson(
    `${graphHost(env)}/v21.0/${encodeURIComponent(env.IG_USER_ID)}/stories?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (status !== 200 || !Array.isArray(data?.data)) {
    const message = graphError("stories fetch", status, data);
    console.error("[stories] " + message);
    return { ok: false, added: 0, skipped: 0, failed: 0, message };
  }

  const index = await readIndex(store);
  const known = new Set(index.map((x) => x.id));
  const stories = (data.data as GraphStory[]).filter((s) => s?.id && !known.has(`ig-${s.id}`));
  // Oldest first so that, if we hit the cap, the ones closest to expiry go first.
  stories.sort((a, b) => (a.timestamp ?? "").localeCompare(b.timestamp ?? ""));

  const added: StoryItem[] = [];
  let failed = 0;
  let deferred = 0;
  for (const s of stories) {
    const isVideo = s.media_type === "VIDEO";
    const cost = isVideo ? 2 : 1;
    if (added.length >= MAX_NEW_PER_RUN || sub.n + cost > SUBREQUEST_BUDGET) {
      deferred++;
      continue;
    }
    try {
      const id = `ig-${s.id}`;
      const stillUrl = isVideo ? s.thumbnail_url : s.media_url;
      if (!stillUrl || (isVideo && !s.media_url)) throw new Error("no media url");
      const still = await fetchBytes(stillUrl, sub);
      if (!still) throw new Error("still download failed");
      const size = jpegSize(new Uint8Array(still.buf));
      if (!size) throw new Error("not a readable JPEG");
      if (isVideo) {
        const video = await fetchBytes(s.media_url!, sub);
        if (!video) throw new Error("video download failed");
        await store.put(`media/${id}.mp4`, video.buf, "video/mp4");
        await store.put(`media/${id}-poster.jpg`, still.buf, "image/jpeg");
      } else {
        await store.put(`media/${id}.jpg`, still.buf, "image/jpeg");
      }
      added.push({
        id,
        ts: normalizeTs(s.timestamp),
        kind: isVideo ? "video" : "image",
        w: size.w,
        h: size.h,
        hidden: false,
        src: "ig",
      });
    } catch (err) {
      failed++;
      console.error(`[stories] story ${s.id} skipped: ${(err as Error).message}`);
    }
  }

  if (added.length) {
    // Re-read right before writing to narrow the race with admin toggles.
    const fresh = await readIndex(store);
    await writeIndex(store, mergeIndex(fresh, added));
  }
  const message =
    `live=${data.data.length} new=${added.length} failed=${failed} deferred=${deferred} ` +
    `total=${index.length + added.length} subrequests=${sub.n}`;
  console.log("[stories] " + message);
  return { ok: true, added: added.length, skipped: deferred, failed, message };
}

/** Worker `scheduled` handler body. */
export async function scheduled(_event: unknown, env: StoriesEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
  ctx.waitUntil(
    runCollector(env).catch((err) => {
      console.error("[stories] collector crashed:", err);
    }),
  );
}
