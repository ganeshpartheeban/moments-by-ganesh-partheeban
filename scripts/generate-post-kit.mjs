// Month-one post kit generator -> ~/Desktop/post-kit/2026-11/
//   gbp/ (5 Google Business Profile posts), instagram/ (12 posts), pinterest/ (pins.csv + 2:3 images), CALENDAR.md
// Run: source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && node scripts/generate-post-kit.mjs
// Re-runnable: wipes and rebuilds the output folder. Reads stories/captions from src/lib/*.ts (read-only).
import sharp from "sharp";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(os.homedir(), "Desktop", "post-kit", "2026-11");
const SITE = "https://ganeshpartheeban.in";
const WA = "+91 98844 26838";
const { CASE_STUDIES } = await import(path.join(ROOT, "src/lib/case-studies.ts"));
const { PHOTO_META } = await import(path.join(ROOT, "src/lib/photo-meta.ts"));

const src = (n) => (n === "portrait" ? path.join(ROOT, "src/assets/portrait.jpg") : n === "hero" ? path.join(ROOT, "src/assets/hero.JPG") : path.join(ROOT, "public/gallery-full", `g${n}.jpg`));

// Focus point (fx, fy as fractions of the source) so faces stay inside tall/wide crops.
const FOCUS = {
  1: [.5, .3], 2: [.5, .35], 3: [.5, .5], 4: [.5, .4], 5: [.5, .45], 6: [.5, .5], 7: [.5, .35], 9: [.5, .5], 10: [.5, .45],
  11: [.5, .4], 12: [.5, .5], 15: [.5, .45], 16: [.5, .4], 17: [.5, .5], 18: [.5, .5], 21: [.5, .45], 22: [.5, .45],
  23: [.5, .45], 24: [.5, .45], 25: [.5, .45], 26: [.5, .5], 28: [.5, .5], 29: [.5, .5], 30: [.5, .45], 35: [.5, .4],
  36: [.5, .5], 37: [.5, .45], 38: [.5, .45], 39: [.5, .45], 40: [.5, .6], 43: [.5, .6], 44: [.5, .45], 46: [.5, .65],
  47: [.5, .6], 20: [.55, .5], 31: [.45, .5], portrait: [.5, .45], hero: [.5, .5],
};
// GBP landscape crops are much tighter on tall photos, so they get their own focus.
const GBP_FOCUS = { 1: [.5, .3], 24: [.5, .36], 11: [.5, .33], 32: [.5, .5], 19: [.5, .5], 8: [.5, .5], 9: [.5, .45] };

async function crop(n, W, H, out, focus) {
  const f = focus || FOCUS[n] || [.5, .5];
  const img = sharp(src(n)).rotate();
  const m = await img.clone().metadata();
  const sw = m.orientation && m.orientation >= 5 ? m.height : m.width, sh = m.orientation && m.orientation >= 5 ? m.width : m.height;
  const s = Math.max(W / sw, H / sh);
  const rw = Math.max(W, Math.round(sw * s)), rh = Math.max(H, Math.round(sh * s));
  const left = Math.min(rw - W, Math.max(0, Math.round(f[0] * rw - W / 2)));
  const top = Math.min(rh - H, Math.max(0, Math.round(f[1] * rh - H / 2)));
  await img.resize(rw, rh).extract({ left, top, width: W, height: H }).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
}

const utm = (p, params) => `${SITE}${p}?${params}`;
const storyOf = (n) => CASE_STUDIES.find((c) => c.sequence.includes(n));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

await rm(OUT, { recursive: true, force: true });
for (const d of ["gbp", "instagram", "pinterest/pins"]) await mkdir(path.join(OUT, d), { recursive: true });

/* ------------------------------------------------------------------ GBP */
const gbp = [
  { w: 1, date: "2026-11-03", photo: 1, path: "/work/mevlin-nikhil", cta: "Learn more", name: "mevlin-nikhil-kerala",
    body: "Mevlin and Nikhil's wedding in Kerala, photographed in monsoon-soft light with their families in motion. I'm a candid wedding photographer in Chennai, and I travel across India for the right date." },
  { w: 2, date: "2026-11-10", photo: 24, path: "/work/bhavana-jayanth", cta: "Learn more", name: "bhavana-jayanth-bengaluru",
    body: "A haldi morning in Bengaluru for Bhavana and Jayanth: close family, long rituals and a lot of laughter. I photograph weddings and the functions around them, from Chennai and across India." },
  { w: 3, date: "2026-11-17", photo: 32, path: "/work/concerts-chennai", cta: "Learn more", name: "concerts-chennai",
    body: "Concerts, launches and stage shows in Chennai are the other half of my work. I photograph the performance, the crowd and the people behind the scenes. Event coverage starts from ₹10,000." },
  { w: 4, date: "2026-11-24", photo: 19, path: "/contact#booking-enquiry", cta: "Book", name: "offer-weekday-dates", offer: true,
    body: "Weekday dates in December are open for candid event photography in Chennai, Bengaluru, Kerala and across India. Weddings, receptions, family functions and concerts, priced by the event from ₹10,000." },
  { w: 5, date: "2026-11-30", photo: 8, path: "/work/theyyam-kannur", cta: "Learn more", name: "theyyam-kannur",
    body: "Theyyam in Kannur, Kerala: fire, drumbeat and a ritual that is centuries old. I photograph family and cultural events in Chennai, across Kerala and across India. Tell me about your occasion." },
];
for (const g of gbp) {
  const [p, hash] = g.path.split("#");
  g.url = `${SITE}${p}?utm_source=gbp&utm_medium=post&utm_campaign=2026-11-w${g.w}${hash ? "#" + hash : ""}`;
  if (g.body.length < 150 || g.body.length > 300) throw new Error(`GBP w${g.w} body ${g.body.length} chars`);
  const dir = path.join(OUT, "gbp", `w${g.w}-${g.date}-${g.name}`);
  await mkdir(dir, { recursive: true });
  await crop(g.photo, 1200, 900, path.join(dir, "photo.jpg"), GBP_FOCUS[g.photo]);
  let txt = `${g.body}\n\nCTA button: ${g.cta}\nLink: ${g.url}\nPost date: ${g.date}\nPost type: ${g.offer ? "Offer" : "What's new"}\n`;
  if (g.offer) txt += `\nOffer fields\nTitle: Weekday dates open in December\nStart: 2026-11-24\nEnd: 2026-12-31\nTerms: Event-based pricing from ₹10,000. Travel and stay quoted separately. Subject to date availability.\nCoupon code: (leave blank unless you decide to offer a real discount)\n`;
  await writeFile(path.join(dir, "caption.txt"), txt);
  g.dir = path.relative(OUT, dir);
}

/* ------------------------------------------------------------ Instagram */
const BROAD = ["#candidphotographer", "#candidphotography", "#indianwedding", "#weddingphotography", "#candidwedding", "#weddingstory", "#documentaryphotography", "#weddingphotographerindia", "#realmoments", "#weddingmoments", "#indianweddingphotography", "#photographersofindia", "#storytellingphotography", "#weddingdiaries", "#chennaiphotographer"];
const T = {
  kerala: ["#keralawedding", "#keralaweddingphotography", "#malayaliwedding", "#keralaweddings", "#keralaphotographer", "#southindianwedding"],
  blr: ["#bangalorewedding", "#bangalorephotographer", "#bengaluruwedding", "#bangaloreweddingphotographer", "#bangaloreweddings", "#southindianwedding"],
  chn: ["#chennaiphotographer", "#chennaiwedding", "#chennaiweddingphotographer", "#tamilwedding", "#tamilnaduwedding", "#southindianwedding", "#chennaidiaries"],
  concert: ["#concertphotography", "#livemusicphotography", "#concertphotographer", "#gigphotography", "#livemusic", "#stagephotography", "#eventphotography", "#indiemusicindia"],
  theyyam: ["#theyyam", "#theyyamkannur", "#kannur", "#malabar", "#folkartsofindia", "#incredibleindia", "#keralagram", "#ritualphotography"],
  haldi: ["#haldiceremony", "#haldiphotography", "#haldi"],
  family: ["#sashtiabdapoorthi", "#familyfunction", "#culturalevents", "#familyphotography", "#diwali", "#diwaliphotography", "#eventphotographerchennai"],
  bts: ["#behindthescenes", "#photographerlife", "#workingstyle", "#eventphotography", "#photographerslife"],
  press: ["#photojournalism", "#editorialphotography", "#featuredphotographer", "#photographyindia", "#eventphotography"],
  pooram: ["#thrissurpooram", "#pooram", "#keralafestivals", "#culturalphotography", "#keralagram", "#incredibleindia"],
  couple: ["#couplephotography", "#engagementphotography", "#pondicherry", "#pondicherrydiaries", "#tamilwedding", "#chennaiphotographer"],
  church: ["#christianwedding", "#churchwedding", "#chennaichurch", "#santhome", "#chennaiwedding", "#weddingdetails"],
};
const CTA = `Planning a date? Message me on WhatsApp, ${WA}. Link in bio.`;
const ig = [
  { date: "2026-11-02", kind: "Story carousel", photos: [1, 6, 10, 12, 18, 40], path: "/work/mevlin-nikhil", loc: "Angamaly, Kerala", tags: [...T.kerala, ...T.haldi.slice(0, 0)],
    hook: "Monsoon light, and nobody was posing.", lines: ["Mevlin and Nikhil's wedding in Kerala, August 2025.", "The aisle, the family, the small in-between moments.", "Swipe for the quiet ones."] },
  { date: "2026-11-04", kind: "Carousel", photos: [47, 48], path: "/", loc: "Santhome Cathedral Basilica, Chennai", tags: T.church,
    hook: "A church wedding at Santhome, Chennai.", lines: ["Seles and Jalvin at Santhome Cathedral Basilica.", "The bouquet, the altar, the flowers around it."] },
  { date: "2026-11-06", kind: "Working-style post (carousel)", photos: ["portrait", 27, 13], path: "/about", loc: "Chennai, Tamil Nadu", tags: T.bts,
    hook: "I work quietly inside the event.", lines: ["Before every shoot I learn the family, the close friends and the key rituals.", "Then I work solo and stay out of the way, so the camera anticipates rather than reacts.", "That is the whole method."] },
  { date: "2026-11-09", kind: "Story carousel", photos: [11, 22, 23, 24, 21, 25], path: "/work/bhavana-jayanth", loc: "Bengaluru, Karnataka", tags: [...T.blr, ...T.haldi],
    hook: "Haldi mornings are the loudest ones.", lines: ["Bhavana and Jayanth, Bengaluru, April 2024.", "Close family, longer rituals, and the laughter that posed photographs miss."] },
  { date: "2026-11-11", kind: "Press feature (single)", photos: ["hero"], path: "/press", loc: "Chennai, Tamil Nadu", tags: T.press,
    hook: "Some of my photographs have travelled.", lines: ["They have appeared in The Hindu, Aaj Tak, NDTV Profit, LiveMint and Condé Nast Traveller India.", "Also Travel + Leisure Asia, UN ESCAP and Cornell University.", "Still, the work I like best is a family, a hall and one quiet moment."] },
  { date: "2026-11-13", kind: "Single frame", photos: [5], path: "/work/theyyam-kannur", loc: "Kannur, Kerala", tags: T.theyyam,
    hook: "Theyyam, Kannur, a night in December.", lines: ["Fire, drumbeat, and a ritual still very much alive on the Malabar coast.", "Rituals and cultural events are part of what I photograph, alongside weddings."] },
  { date: "2026-11-16", kind: "Story carousel", photos: [2, 4, 41, 42], path: "/work/agam-bengaluru", loc: "Bengaluru, Karnataka", tags: T.concert,
    hook: "Stagelight, and a crowd carried by the music.", lines: ["Agam live in Bengaluru, June 2025.", "I photograph concerts with the same quiet approach as weddings: the stage, the crowd and the crew."] },
  { date: "2026-11-18", kind: "Single frame", photos: [29], path: "/", loc: "Coromandel Cafe, Pondicherry", tags: T.couple,
    hook: "A dinner table, two people, one laugh.", lines: ["Azhagi and Varatha at Coromandel Cafe, Pondicherry.", "Engagements and couple portraits are part of what I cover."] },
  { date: "2026-11-20", kind: "Story carousel", photos: [9, 15, 17, 19, 20, 26], path: "/work/swati-sushin", loc: "Kerala", tags: [...T.kerala, ...T.haldi],
    hook: "Two days, one house, no script.", lines: ["Swati and Sushin's late-monsoon wedding in Kerala, October 2024.", "Ceremonies, guests and quiet corners, as they unfolded."] },
  { date: "2026-11-23", kind: "Story carousel", photos: [33, 32, 34, 30, 35, 44], path: "/work/concerts-chennai", loc: "Chennai, Tamil Nadu", tags: [...T.concert, "#chennaimusic", "#chennaievents"],
    hook: "Chennai's stages, one frame at a time.", lines: ["A concert at Nehru Indoor Stadium, The Indian Choral Ensemble at Victoria House, and a film celebration at Zostel Anna Nagar.", "Concerts and events are the other half of my work."] },
  { date: "2026-11-25", kind: "Single frame", photos: [3], path: "/", loc: "Thrissur, Kerala", tags: T.pooram,
    hook: "Thrissur Pooram, 2025.", lines: ["A caparisoned elephant in gold, photographed at the Pooram.", "Cultural events across Kerala and the rest of India are part of my work."] },
  { date: "2026-11-27", kind: "Single frame", photos: [46], path: "/services", loc: "Chennai, Tamil Nadu", tags: T.family,
    hook: "Diwali in Chennai, 2024.", lines: ["Two figures against the smoke, after the crackers.", "Family and cultural functions, from Diwali evenings to a sashtiabdapoorthi, are part of what I cover.", "Weekday dates in December are open."] },
];
const NN = (i) => String(i + 1).padStart(2, "0");
for (const [i, p] of ig.entries()) {
  p.w = Math.floor(i / 3) + 1;
  const dir = path.join(OUT, "instagram", `${NN(i)}-${p.date}-${slug(p.kind.split(" (")[0])}-${slug(String(p.photos[0]))}`);
  await mkdir(dir, { recursive: true });
  for (const [j, n] of p.photos.entries()) await crop(n, 1080, 1350, path.join(dir, `${String(j + 1).padStart(2, "0")}.jpg`));
  await crop(p.photos[0], 1080, 1920, path.join(dir, "story.jpg"));
  const tags = [...new Set([...p.tags, ...BROAD])].slice(0, 24);
  if (tags.length < 20) throw new Error(`IG ${i + 1}: only ${tags.length} tags`);
  p.url = utm(p.path, `utm_source=instagram&utm_medium=social&utm_campaign=2026-11-w${p.w}`);
  p.tagCount = tags.length;
  await writeFile(path.join(dir, "caption.txt"), `${p.hook}\n\n${p.lines.join("\n")}\n\nLocation tag: ${p.loc}\n\n${CTA}\n\n${tags.join(" ")}\n`);
  p.dir = path.relative(OUT, dir);
}

/* ------------------------------------------------------------ Pinterest */
const SUBJECT = {
  1: "Bride and groom walking hand in hand", 2: "Vocalist on stage in amber light", 3: "Caparisoned elephant with a gold nettipattam", 4: "Bassist on stage under yellow lights",
  5: "Close portrait of a Theyyam performer in red face paint", 6: "Bride smiling from a car seat beside a young boy", 7: "Woman in green silk and gold jewellery, laughing by open fields",
  8: "Theyyam performer in a red headdress with a child", 9: "Bride smiling as turmeric is applied at a haldi", 10: "Bride holding a bouquet, a quiet detail", 11: "Couple laughing in a haldi embrace",
  12: "Groom kneeling beside his bride in a gold saree", 13: "Hands during a ritual, turmeric and bangles", 14: "Detail of a raised hand with red bangles", 15: "Woman in green laughing in a wooden doorway",
  16: "Couple in white and navy outside a church", 17: "Kathakali performer in full costume", 18: "Couple sharing a quiet moment, in white and navy", 19: "Clasped hands and flower garlands at a ceremony",
  20: "Couple seen through a car window", 21: "Bride in a red and gold saree, laughing", 22: "Woman in white and sunglasses beside a pillar at a haldi", 23: "Couple dancing on a red carpet",
  24: "Woman seated among yellow flowers at a haldi", 25: "Couple garlanded under fairy lights at night", 26: "Couple in ivory outfits in a garden", 27: "Held hands and a gold bangle at a ceremony",
  28: "Groom kneeling beside his bride on a gold sofa", 29: "Couple sharing a laugh at a cafe table", 30: "Director speaking on stage with a microphone", 31: "Theyyam in red costume, seen over a woman's shoulder",
  32: "Concert stage lit with a floral light design", 33: "Singer on stage with a choir behind", 34: "Choir and guitarist on stage", 35: "Director laughing with a microphone", 36: "Couple at the aisle of a church",
  37: "Black and white portrait of a woman smiling through a car window", 38: "Woman in a red saree among large green leaves", 39: "Couple seated with family beside a traditional lamp", 40: "White cross and shrine on a rainy road, a cyclist passing",
  41: "Guitarist on stage in red light", 42: "Musician in silhouette under stagelights", 43: "Man in a hat smiling among trees", 44: "Two men sharing a hug", 45: "Theyyam performer beside fire at night",
  46: "Two figures in silhouette against Diwali smoke", 47: "Bridal bouquet of peach roses", 48: "Wedding at the altar framed by flowers",
};
const VENUE_CITY = { "Santhome Cathedral Basilica": "Chennai", "Zostel Anna Nagar": "Chennai", "Nehru Indoor Stadium": "Chennai", "Victoria House": "Chennai" };
const BOARD = { wedding: "South Indian weddings", candid: "Candid moments", events: "Concerts & events" };
const pins = [];
for (let n = 1; n <= 48; n++) {
  const st = storyOf(n), m = PHOTO_META[n];
  const kind = st?.kind;
  const board = kind === "wedding" || (!st && [13, 36, 47, 48].includes(n)) ? BOARD.wedding : kind === "concert" || kind === "events" ? BOARD.events : BOARD.candid;
  const city = (m?.location || VENUE_CITY[m?.venue] || st?.location || "").split(",")[0].trim();
  const regionPlace = m?.location || st?.location || VENUE_CITY[m?.venue] || "";
  const title0 = m ? [m.title, m.detail].filter(Boolean).join(" · ") : st.title;
  const tail = board === BOARD.wedding ? "candid wedding photography" : board === BOARD.events ? "event photography" : kind === "ritual" ? "ritual photography" : "candid photography";
  const title = `${title0}${regionPlace ? ", " + regionPlace : ""} · ${tail}`.slice(0, 100);
  const bits = [m?.venue, regionPlace].filter(Boolean).join(", ");
  const when = m?.date || st?.date;
  let d = `${SUBJECT[n]}.`;
  d += ` ${title0}${m?.featuring ? ", featuring " + m.featuring : ""}${bits ? (m?.venue ? " at " : " in ") + bits : ""}${when ? ", " + when : ""}.`;
  d += ` ${board === BOARD.wedding ? "Candid wedding photography" : board === BOARD.events ? "Concert and event photography" : "Candid photography"} by Ganesh Partheeban, a Chennai-based photographer available across India. Event-based pricing from ₹10,000.`;
  const kw = [tail, "Ganesh Partheeban", "Chennai photographer", city && `${city} photographer`, board === BOARD.wedding && "south indian wedding", /Kerala/.test(regionPlace) && "kerala wedding photography",
    board === BOARD.wedding && /Bengaluru/.test(regionPlace) && "bangalore wedding photographer", m?.detail === "Haldi" && "haldi ceremony", st?.slug === "theyyam-kannur" && "theyyam", board === BOARD.events && "concert photography", "candid moments"].filter(Boolean);
  const link = st ? utm(`/work/${st.slug}`, "utm_source=pinterest&utm_medium=pin") : utm("/", "utm_source=pinterest&utm_medium=pin");
  pins.push({ n, title, desc: d.slice(0, 500), board, link, kw: [...new Set(kw)].join(",") });
  await crop(n, 1000, 1500, path.join(OUT, "pinterest/pins", `pin-${String(n).padStart(2, "0")}-g${n}.jpg`));
}
// Interleave boards across the schedule, 2 pins a day from 2026-11-02.
const byBoard = {};
for (const p of pins) (byBoard[p.board] ||= []).push(p);
const ordered = Object.values(byBoard).flatMap((arr) => arr.map((p, i) => ({ p, r: (i + 0.5) / arr.length }))).sort((a, b) => a.r - b.r || a.p.n - b.p.n).map((x) => x.p);
const csvEsc = (s) => `"${String(s).replace(/"/g, '""')}"`;
const rows = [["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"]];
ordered.forEach((p, i) => {
  const day = new Date(Date.UTC(2026, 10, 2 + Math.floor(i / 2)));
  p.date = `${day.toISOString().slice(0, 10)}T${i % 2 ? "18:30" : "09:30"}:00`;
  rows.push([p.title, `${SITE}/gallery-full/g${p.n}.jpg`, p.board, "", p.desc, p.link, p.date, p.kw]);
});
await writeFile(path.join(OUT, "pinterest/pins.csv"), rows.map((r) => r.map(csvEsc).join(",")).join("\n") + "\n");

/* ------------------------------------------------------------- CALENDAR */
const dow = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
const cal = [];
for (const g of gbp) cal.push({ date: g.date, time: "11:00", where: "GBP + Facebook", what: `${g.offer ? "Offer" : "What's new"}: ${g.name}`, folder: g.dir, link: g.url });
for (const p of ig) cal.push({ date: p.date, time: "19:00", where: "Instagram + Facebook", what: `${p.kind}: ${p.hook}`, folder: p.dir, link: `${p.url} (link in bio)` });
cal.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
const pinDays = {};
for (const p of ordered) (pinDays[p.date.slice(0, 10)] ||= []).push(p.n);
const md = `# November 2026 posting calendar

Moments by Ganesh Partheeban. Everything below lives in this folder. Times are IST suggestions, move them if your audience is more active at other hours.

## Posts

| Date | Day | Time | Where | What | Folder | Link (UTM) |
|---|---|---|---|---|---|---|
${cal.map((c) => `| ${c.date} | ${dow(c.date)} | ${c.time} | ${c.where} | ${c.what} | \`${c.folder}\` | ${c.link} |`).join("\n")}

## Pinterest (two pins a day, 2 to 25 November)

Upload \`pinterest/pins.csv\` through Pinterest, Business hub, Create, Bulk create pins. Pinterest only accepts scheduled dates up to 30 days ahead, so if the upload rejects later dates, delete those rows and upload them in a second batch around 14 November. Pin images in the CSV are fetched from ganeshpartheeban.in/gallery-full, so the site must be live. If you prefer manual upload, use the 1000x1500 images in \`pinterest/pins/\` (file name = gallery number) with the title, description and link from the CSV.

| Date | Gallery photos pinned (09:30 and 18:30) |
|---|---|
${Object.entries(pinDays).map(([d, ns]) => `| ${d} | ${ns.map((n) => `g${n}`).join(", ")} |`).join("\n")}

## HOW-TO: post to Google Business Profile, Instagram and Facebook together

Buffer and Publer both work. The steps are the same in either.

1. Connect your channels once: Instagram (it must be a Business or Creator account), your Facebook Page, and your Google Business Profile. Check that your plan includes Google Business Profile, as some free plans do not.
2. Create a new post. Pick Instagram and Facebook together for the Instagram posts, and Google Business Profile alone (add Facebook if you like) for the GBP posts.
3. Upload the photos from the post's folder in order: \`01.jpg\`, \`02.jpg\` and so on. Instagram posts are 1080x1350 (4:5). GBP posts use \`photo.jpg\` (1200x900).
4. Paste the text from \`caption.txt\`. For GBP, copy the body only, then set the CTA button and link as written in the file. For an Offer post, also fill in the offer title, dates and terms from the file.
5. Set the date and time from the table above and schedule. Preview each post once before queuing.
6. Instagram stories: each Instagram folder has a \`story.jpg\` (1080x1920). Scheduling stories depends on your tool and plan. If it only sends a reminder, post the story from the Instagram app on the same day.
7. Instagram does not make caption links clickable. Keep the booking link in your bio and swap it to the UTM link in the table that week, so you can see which posts bring enquiries.
8. Facebook accepts the same caption. Remove the hashtag block if you want it cleaner there.
9. Reply to comments and WhatsApp messages the same day. Replies are what turn a post into an enquiry.

## Google Business Profile: weekly rhythm

- Monday or Tuesday: publish the week's post (What's new, or the Offer in week 4).
- Once a week: add three to five new photos to the profile Photos tab, mostly recent work, not repeats of posted images.
- Reply to every new review within two days, including short ones. Keep replies plain and personal.
- Check Questions and answers and messages weekly.
- Once a month: look at Insights (searches, calls, website taps) and note which post types brought them.
- Keep business name, hours, service areas (Chennai, Bengaluru, Kerala, across India) and phone number identical to the website.

## Review request message (WhatsApp)

Send it two or three days after the gallery is delivered, to one person, by name.

> Hi [Name], it was a pleasure photographing [event]. If you have a minute, a short Google review would help other families find me, and it means a lot. You can leave it here: [GOOGLE_REVIEW_LINK]
>
> Thank you again, Ganesh

Replace \`[GOOGLE_REVIEW_LINK]\` with the short link from your Google Business Profile (Get more reviews, Share review form).
`;
await writeFile(path.join(OUT, "CALENDAR.md"), md);
console.log(`gbp ${gbp.length}, instagram ${ig.length} (${ig.reduce((a, p) => a + p.photos.length, 0)} frames, tags ${Math.min(...ig.map((p) => p.tagCount))}-${Math.max(...ig.map((p) => p.tagCount))}), pins ${pins.length} -> ${OUT}`);
