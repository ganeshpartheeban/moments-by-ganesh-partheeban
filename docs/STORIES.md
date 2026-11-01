# Stories wall

`/stories` (and `/ta/stories`) is a photo wall of Instagram stories that fills itself.

> **Token type.** The token generated from the app dashboard's "API setup with Unified login" is a *system-user* token (starts with `EAA`). It never expires and works only on `graph.facebook.com`; the collector detects this and skips refresh. Tokens from the Instagram-login flow start with `IG`, use `graph.instagram.com` and are refreshed automatically. `IG_GRAPH_HOST` overrides the host if ever needed.

## How it works

```
Instagram (live stories, 24 h)
   | hourly cron "0 * * * *"  -> scheduled() in src/server.ts
   v
src/server/stories-collector.ts
   | copies media into R2 bucket `moments-stories`, appends to index.json
   v
R2: index.json | token.json | media/<id>.jpg | media/<id>.mp4 + media/<id>-poster.jpg
   v
/stories      (SSR, loader reads index.json via a server function)
/stories/media/<file>   (streams from R2, immutable cache)
/stories/admin?key=...  (hide/show, run collector now)
/sitemap.xml  (page in both locales + one image entry per visible story)
```

- `index.json` entries: `{id, ts, kind: "image"|"video", w, h, hidden, src: "ig"|"archive", caption?}`.
- Collector ids are `ig-<instagram id>`, archive ids `archive-<unix timestamp>`.
- Videos are stored with their Instagram thumbnail as the poster; the wall shows the poster with a play glyph and the lightbox plays the video.
- The collector writes `index.json` once, last, so a partial failure never corrupts it. Hidden flags are never reset by a merge.
- Code: `src/lib/stories-core.ts` (pure helpers, JPEG size parser, merge), `src/server/stories-store.ts` (R2 or dev mock), `src/server/stories-collector.ts`, `src/lib/stories.functions.ts` (server functions), routes `stories.tsx`, `stories_.admin.tsx`, `stories_.media.$file.tsx`.
- The `STORIES` binding is read with `import("cloudflare:workers")`. `npm run dev` runs in Node, where that import fails, so the store falls back to `.stories-mock/` (gitignored). Create it with `node scripts/make-stories-mock.mjs`. In dev the admin key is `dev-key`.

## One-time setup

1. Create the bucket (needs `npx wrangler login`):
   `npx wrangler r2 bucket create moments-stories`
2. Secrets (run from the repo, paste the value when asked):
   ```
   npx wrangler secret put IG_USER_ID
   npx wrangler secret put IG_ACCESS_TOKEN
   npx wrangler secret put STORIES_ADMIN_KEY
   ```
   `STORIES_ADMIN_KEY` is any long random string you choose; it is the `key` in the admin URL.
3. GitHub Actions deploy: the Cloudflare API token used by `.github/workflows/deploy.yml` needs the permission **Workers R2 Storage: Edit** (Read is not enough to deploy a worker that has an R2 binding on a fresh account), plus the existing Workers permissions. Without it the deploy fails when it tries to attach the `STORIES` binding.
4. Deploy as usual. The cron trigger is created from `wrangler.jsonc`.

## Meta (Instagram) steps for the owner

1. Go to developers.facebook.com, log in, **Create app**.
2. Choose the use case **Instagram** (API setup with Instagram login).
3. Open **Instagram > API setup with Instagram login**.
4. Add `@ganeshpartheeban` as an **Instagram Tester** (App roles > Roles > Add People > Instagram Testers).
5. In the Instagram app: **Settings > Website permissions > Apps and websites > Tester invites** and accept the invite.
6. Back in the Meta dashboard, **Generate token** for the account. Permission needed: `instagram_business_basic`.
7. Copy the long-lived token and the Instagram user ID shown there. These are `IG_ACCESS_TOKEN` and `IG_USER_ID`.

The account must be a Professional (Business or Creator) account.

### Token life

Long-lived tokens last 60 days. On its first run the collector copies `IG_ACCESS_TOKEN` into `token.json`; when the token is 45 days old it refreshes itself through `refresh_access_token` and stores the new one. The secret is only a bootstrap. If the cron ever logs `TOKEN EXPIRED OR INVALID` (for example the worker was off for 60 days), generate a new token, run `npx wrangler secret put IG_ACCESS_TOKEN` and delete `token.json` from the bucket (`npx wrangler r2 object delete moments-stories/token.json --remote`).

## Importing old stories (archive)

Instagram only exposes live stories (24 h) through the API. Older ones come from the data export.

1. Instagram > Settings > Accounts Center > Your information and permissions > **Download your information**.
2. Choose the account, **Export to device**, select **Stories** under Your Instagram activity (or everything), date range **All time**, format **JSON**, media quality High.
3. Download and unzip when the email arrives.
4. Try it first: `node scripts/import-ig-archive.mjs /path/to/unzipped --dry-run`
5. Test against the local mock: `node scripts/import-ig-archive.mjs /path/to/unzipped --local`
6. Real import (logged in with wrangler): `node scripts/import-ig-archive.mjs /path/to/unzipped`

Extra flags: `--hidden` (import as hidden, approve later in the admin), `--since YYYYMM` / `--until YYYYMM` (month range), `--videos` (also import mp4 with a poster from macOS `qlmanage`; off by default). HEIC/HEIF is converted with macOS `sips`. Uploads run 6 at a time, progress prints every 50 items, Ctrl-C saves the index with what was done, and re-running skips items already in the index.
   Options: `--limit N` (newest N), `--dry-run`, `--local`.

The script reads `stories.json` (it looks in `your_instagram_activity/content/`, `content/`, `media/` and then searches), uploads images as `media/archive-<timestamp>.jpg`, and merges them into `index.json` without touching existing entries. Videos are skipped and counted (a poster frame needs ffmpeg; not implemented). Needs Node 22.18+.

## Curation

`https://<site>/stories/admin?key=<STORIES_ADMIN_KEY>` lists every item (compact index, filtered in the browser) with a month navigator, Hidden/Visible/All toggle, id filter, 120-tile windowing, click and shift-click selection, bulk Show/Hide (selected or a whole month, one index write via `setVisibility`), per-card Hide/Show and rotate, and a **Run collector now** button. Wrong or missing key returns 404. Hidden items disappear from the page, JSON-LD and sitemap immediately (the page loader is not cached on the server; the browser may hold the older list for about a minute). A hide racing with the hourly cron in the same second could be overwritten; just hide again.

## Rotating a frame

Instagram sometimes delivers a story whose pixels are turned a quarter turn with no EXIF tag. In the admin, use **⟲ 90°** / **⟳ 90°** under the card. The browser fetches the image, rotates it on a canvas, re-encodes JPEG (quality 0.92) and uploads it (FormData: `key`, `id`, `dir`, `file`) to the `rotateStory` server function, which overwrites `media/<id>.jpg`, updates `w`/`h` and bumps the item's `v`. Media URLs carry `?v=<v>` so the immutable cache is bypassed. Re-encoding is lossy; rotate as few times as possible. Videos cannot be rotated (the control is disabled). Landscape results span two columns on the wall.

## Limits (Workers free plan)

- 50 subrequests and 10 ms CPU per invocation. The collector budgets 44 fetches (stories list, optional token refresh, 1 per image, 2 per video) and takes at most 20 new stories per run; the rest are picked up next hour while still live. R2 reads and writes are binding calls, not counted as external subrequests.
- No image resizing happens in the Worker (not possible within 10 ms CPU). Originals are served as-is (Instagram stories are 1080x1920, roughly 150 to 300 KB). If the wall gets heavy, enable Cloudflare Image Transformations on the zone and serve `/cdn-cgi/image/width=400,quality=75/stories/media/<id>.jpg` for the thumbnails.
- Only live stories are collectable. If the cron is down for more than 24 h, those stories are lost (the archive import can recover them later).

## Privacy

Stories show clients and guests. Get consent before publishing faces, hide anything that was not cleared in the admin view, and remember that hiding does not delete the file from R2 (delete `media/<id>.*` and the index entry for a hard removal).

### Fast uploads via the S3 API

Set `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`) in the environment and the importer uploads directly to R2 with 16 parallel PUTs instead of spawning wrangler per object (about 80 items/s on the dry run versus 0.3/s through wrangler). Create the token in the dashboard under R2 → Manage R2 API Tokens, as an Account API token with Object Read & Write scoped to `moments-stories`.
