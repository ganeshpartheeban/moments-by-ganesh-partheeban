// Brochure generator: A5 landscape, 8 pages -> public/brochure.pdf (+ PNG previews on Desktop).
// Run: source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && node scripts/generate-brochure.mjs
// Uses Chrome's CLI (no puppeteer needed) to print HTML to PDF and to screenshot each page.
import sharp from "sharp";
import QRCode from "qrcode";
import { mkdir, writeFile, readFile, copyFile, rm, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TMP = path.join(os.tmpdir(), "brochure-build");
const PREVIEW = path.join(os.homedir(), "Desktop", "brochure-preview");
const OUT_PDF = path.join(ROOT, "public", "brochure.pdf");
const SITE = "https://ganeshpartheeban.in/";

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
await mkdir(PREVIEW, { recursive: true });

// fonts
const fontDir = (p, f) => path.join(ROOT, "node_modules/@fontsource-variable", p, "files", f);
await copyFile(fontDir("fraunces", "fraunces-latin-wght-normal.woff2"), path.join(TMP, "fraunces.woff2"));
await copyFile(fontDir("inter-tight", "inter-tight-latin-wght-normal.woff2"), path.join(TMP, "inter.woff2"));

// images (9:16 originals are used whole; hero cropped to panel)
const gal = (n) => path.join(ROOT, "public/gallery-full", `g${n}.jpg`);
const prep = async (src, name, w, h, opts = {}) =>
  sharp(src).rotate().resize(w, h, { fit: "cover", position: opts.position || "centre" }).jpeg({ quality: opts.q || 80, mozjpeg: true }).toFile(path.join(TMP, name));
const tall = [1, 40, 11, 24, 5, 2, 37];
for (const n of tall) await prep(gal(n), `g${n}.jpg`, 720, 1280);
await prep(path.join(ROOT, "src/assets/hero.JPG"), "hero.jpg", 1300, 1500, { q: 78 });
await prep(path.join(ROOT, "src/assets/portrait.jpg"), "portrait.jpg", 700, 1000, { q: 82 });
const qr = await QRCode.toString(SITE, { type: "svg", margin: 0, color: { dark: "#2a2522", light: "#f4ede2" } });

// press names from the site's source of truth
const pressSrc = await readFile(path.join(ROOT, "src/lib/press.ts"), "utf8");
const press = [...pressSrc.matchAll(/^\s+name: "([^"]+)"/gm)].map((m) => m[1]).slice(0, 10);

const services = [
  ["01", "Candid Wedding Photography", "Full-day coverage of the wedding and the events around it, from ceremony to celebration.", "Haldi, church and home ceremonies, the celebration that follows"],
  ["02", "Reception Photography", "Natural coverage of interactions and emotion at receptions and after-parties.", "Stage and guests, family portraits, speeches and toasts"],
  ["03", "Engagement & Pre-Wedding", "Quiet storytelling for intimate ceremonies and pre-wedding gatherings.", "Roka, sagai, engagement, couple portraits, decor and details"],
  ["04", "Family & Cultural Events", "Traditional functions, milestone celebrations and special gatherings.", "Sashtiabdapoorthi, Diwali and festival gatherings, multi-generational portraits"],
  ["05", "Events, Concerts & Behind-the-Scenes", "The same observational eye, applied to stage, crowd and crew.", "Concerts, launches, showcases, corporate and cultural events"],
  ["06", "Candid Videography", "Short films and reels, as an add-on to photography.", "Coming soon"],
];

const story = (label, title, intro, photos) => `
  <section class="page story">
    <div class="txt">
      <p class="lab">${label}</p>
      <h2>${title}</h2>
      <p class="body">${intro}</p>
      <p class="lab foot">Ganesh Partheeban</p>
    </div>
    ${photos.map(([n, cap]) => `<figure><img src="g${n}.jpg"><figcaption class="lab">${cap}</figcaption></figure>`).join("")}
  </section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Moments by Ganesh Partheeban</title>
<style>
@font-face{font-family:Fraunces;src:url(fraunces.woff2);font-weight:100 900}
@font-face{font-family:"Inter Tight";src:url(inter.woff2);font-weight:100 900}
@page{size:210mm 148mm;margin:0}
:root{--cream:#f4ede2;--ink:#2a2522;--accent:#a85a30;--mute:rgba(42,37,34,.62);--hair:rgba(42,37,34,.22)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--cream)}
body{font-family:"Inter Tight",sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:148mm;position:relative;overflow:hidden;background:var(--cream);page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
.lab{font-size:6.2pt;letter-spacing:.22em;text-transform:uppercase;color:var(--mute);font-weight:500}
.lab.acc{color:var(--accent)}
h1,h2,h3{font-family:Fraunces,serif;font-weight:380;letter-spacing:-.015em;line-height:1.05}
h2{font-size:25pt}
em{font-style:normal;color:var(--accent)}
.body{font-size:8.6pt;line-height:1.6}
.body.mute{color:var(--mute)}
.pn{position:absolute;bottom:8mm;right:14mm;font-size:6pt;letter-spacing:.2em;color:var(--mute)}
/* cover */
.cover img{position:absolute;right:0;top:0;width:128mm;height:148mm;object-fit:cover}
.cover .l{position:absolute;left:14mm;top:14mm;bottom:14mm;width:60mm;display:flex;flex-direction:column;justify-content:space-between}
.cover h1{font-size:30pt;margin-top:5mm}
.cover .rule{width:12mm;border-top:1px solid var(--accent);margin:6mm 0}
/* about */
.about .txt{position:absolute;left:14mm;top:16mm;width:104mm}
.about h2{margin:5mm 0 7mm}
.about .body+.body{margin-top:3.5mm}
.about ul{list-style:none;margin-top:7mm;border-top:1px solid var(--hair)}
.about li{font-size:8pt;padding:2mm 0;border-bottom:1px solid var(--hair);display:flex;gap:4mm}
.about li span{color:var(--accent);font-size:6.2pt;letter-spacing:.2em;padding-top:.5mm}
.about img{position:absolute;right:14mm;top:14mm;width:62mm;height:90mm;object-fit:cover;object-position:50% 25%}
.about .cap{position:absolute;right:14mm;top:107mm;width:62mm}
/* services */
.svc{padding:14mm}
.svc h2{margin:4mm 0 8mm;font-size:22pt}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0 8mm}
.cell{border-top:1px solid var(--hair);padding:3mm 0 5mm}
.cell h3{font-size:10.5pt;margin:1.5mm 0 2mm;line-height:1.15}
.cell p{font-size:7.4pt;line-height:1.5;color:var(--mute)}
.cell .occ{color:var(--ink);margin-top:1.8mm}
.cell.soon{opacity:.7}
/* story */
.story .txt{position:absolute;left:14mm;top:16mm;width:58mm}
.story h2{margin:4mm 0 6mm}
.story .foot{position:absolute;top:116mm;left:0}
.story figure{position:absolute;top:16mm;width:56mm}
.story figure:nth-of-type(1){left:82mm}
.story figure:nth-of-type(2){left:142mm}
.story img{width:56mm;height:99.5mm;object-fit:cover;display:block}
.story figcaption{margin-top:2.5mm;line-height:1.5;font-size:5.6pt}
.two .mini{margin-top:5mm;padding-top:3mm;border-top:1px solid var(--hair)}
.two .mini h3{font-size:12pt;margin:1.5mm 0 1.5mm}
.two .mini p{font-size:7.6pt;line-height:1.5;color:var(--mute)}
/* booking */
.book{padding:14mm}
.book h2{margin:4mm 0 7mm;font-size:22pt}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:7mm}
.step{border-top:1px solid var(--ink);padding-top:3mm}
.step .n{font-family:Fraunces,serif;font-size:15pt;color:var(--accent)}
.step h3{font-size:10.5pt;margin:2mm 0 2mm}
.step p{font-size:7.4pt;line-height:1.55;color:var(--mute)}
.price{margin-top:8mm;display:flex;gap:6mm;align-items:baseline;border-top:1px solid var(--hair);padding-top:4mm}
.price b{font-family:Fraunces,serif;font-weight:380;font-size:20pt}
.price span{font-size:7.4pt;color:var(--mute)}
.press{position:absolute;left:14mm;right:14mm;bottom:15mm}
.press p.names{margin-top:2.5mm;font-family:Fraunces,serif;font-size:8.6pt;line-height:1.9;letter-spacing:0}
.press p.names i{font-style:normal;color:var(--accent);padding:0 .5mm}
/* contact */
.contact img{position:absolute;left:0;top:0;width:83mm;height:148mm;object-fit:cover;object-position:50% 40%}
.contact .r{position:absolute;left:100mm;right:14mm;top:16mm;bottom:14mm}
.contact h2{margin:4mm 0 7mm;font-size:24pt}
.contact dl{display:grid;grid-template-columns:22mm 1fr;gap:2.6mm 0;font-size:8.6pt;border-top:1px solid var(--hair);padding-top:4mm}
.contact dt{padding-top:.4mm}
.qr{position:absolute;bottom:0;left:0;display:flex;gap:5mm;align-items:flex-end}
.qr svg{width:27mm;height:27mm}
.qr p{font-size:7.2pt;line-height:1.5;color:var(--mute);width:48mm}
</style></head><body>

<section class="page cover">
  <img src="hero.jpg">
  <div class="l">
    <p class="lab acc">Portfolio &amp; services</p>
    <div>
      <p class="lab">Moments by</p>
      <h1>Ganesh<br>Partheeban</h1>
      <div class="rule"></div>
      <p class="body">Candid photographer<br>Chennai &middot; across India</p>
    </div>
    <p class="lab">ganeshpartheeban.in</p>
  </div>
</section>

<section class="page about">
  <div class="txt">
    <p class="lab acc">About</p>
    <h2>I let the moments happen <em>naturally</em>.</h2>
    <p class="body">I'm Ganesh Partheeban, a candid photographer based in Chennai. I cover weddings, family functions, concerts, launches and behind-the-scenes work, documenting laughter between friends, quiet glances, and the atmosphere that makes each event its own.</p>
    <p class="body mute">I work solo, blending into the crowd instead of interrupting it. Before every shoot I learn the family, the close friends and the key rituals, so the camera anticipates rather than reacts.</p>
    <ul>
      <li><span>01</span>Observing interactions</li>
      <li><span>02</span>Anticipating emotions</li>
      <li><span>03</span>Capturing genuine reactions</li>
      <li><span>04</span>Documenting meaningful moments naturally</li>
    </ul>
  </div>
  <img src="portrait.jpg">
  <p class="lab cap">Ganesh Partheeban &middot; Tamil Nadu</p>
  <span class="pn">02</span>
</section>

<section class="page svc">
  <p class="lab acc">Services</p>
  <h2>Weddings, and every occasion around them.</h2>
  <div class="grid">
    ${services.map(([n, t, b, o]) => `<div class="cell${n === "06" ? " soon" : ""}"><p class="lab acc">${n}</p><h3>${t}</h3><p>${b}</p><p class="occ">${o}</p></div>`).join("")}
  </div>
  <span class="pn">03</span>
</section>

${story("Wedding &middot; Kerala &middot; August 2025", "Mevlin weds <em>Nikhil</em>", "A Kerala wedding photographed through monsoon-soft light. Family in motion, slow rituals, and the small in-between moments that usually slip past a camera.", [[1, "Mevlin weds Nikhil<br>Kerala &middot; August 2025"], [40, "Mevlin weds Nikhil<br>Angamaly, Kerala &middot; August 2025"]])}

${story("Wedding &middot; Bengaluru &middot; April 2024", "Bhavana weds <em>Jayanth</em>", "Close family, longer rituals, and the kind of glances and laughs that go missing in posed photographs.", [[11, "Bhavana weds Jayanth<br>Haldi &middot; Bengaluru &middot; April 2024"], [24, "Bhavana weds Jayanth<br>Haldi &middot; Bengaluru &middot; April 2024"]])}

<section class="page story two">
  <div class="txt">
    <p class="lab">Rituals &amp; stages</p>
    <h2>Beyond the <em>wedding</em></h2>
    <div class="mini"><p class="lab acc">Kannur &middot; December 2024</p><h3>Theyyam</h3><p>Fire, drumbeat, and the heavy, dignified pull of a centuries-old ritual still alive on the Malabar coast.</p></div>
    <div class="mini"><p class="lab acc">Bengaluru &middot; June 2025</p><h3>Agam, live</h3><p>Stagelight, instruments in motion, and a crowd carried by the music.</p></div>
  </div>
  <figure><img src="g5.jpg"><figcaption class="lab">Theyyam<br>Kannur &middot; December 2024</figcaption></figure>
  <figure><img src="g2.jpg"><figcaption class="lab">Agam concert<br>Bengaluru &middot; June 2025</figcaption></figure>
</section>

<section class="page book">
  <p class="lab acc">How booking works</p>
  <h2>A quick chat, then your date confirmed.</h2>
  <div class="steps">
    <div class="step"><span class="n">1</span><h3>Message me on WhatsApp</h3><p>Most bookings begin here, or by email. Tell me the occasion, the city and the date.</p></div>
    <div class="step"><span class="n">2</span><h3>Date availability</h3><p>Tell me the date and I will check it. Bookings are confirmed by date availability.</p></div>
    <div class="step"><span class="n">3</span><h3>Event-based pricing</h3><p>Priced by the event, never by the hour. Travel and stay are quoted separately.</p></div>
    <div class="step"><span class="n">4</span><h3>Digital delivery</h3><p>Galleries land quickly, with social-ready exports for Instagram and WhatsApp. All deliverables are digital; no printed albums.</p></div>
  </div>
  <div class="price"><span class="lab">Event coverage from</span><b>&#8377;10,000</b><span>per event &middot; available across India</span></div>
  <div class="press">
    <p class="lab acc">As featured in</p>
    <p class="names">${press.map((n, i) => `<span style="white-space:nowrap">${n}${i < press.length - 1 ? ' <i>/</i>' : ''}</span>`).join(' ')}</p>
  </div>
  <span class="pn">07</span>
</section>

<section class="page contact">
  <img src="g37.jpg">
  <div class="r">
    <p class="lab acc">Contact</p>
    <h2>Tell me about <em>your day</em>.</h2>
    <dl>
      <dt class="lab">WhatsApp</dt><dd>+91 98844 26838</dd>
      <dt class="lab">Email</dt><dd>ganeshpartheeban@gmail.com</dd>
      <dt class="lab">Instagram</dt><dd>@ganeshpartheeban</dd>
      <dt class="lab">Web</dt><dd>ganeshpartheeban.in</dd>
      <dt class="lab">Based</dt><dd>Chennai, available across India</dd>
    </dl>
    <div class="qr">${qr}<p>Scan for the full portfolio, stories and booking enquiry.</p></div>
  </div>
</section>

<script>if(location.hash){const k=+location.hash.slice(1);document.querySelectorAll('.page').forEach((p,i)=>{p.style.display=(i+1===k)?'block':'none'})}</script>
</body></html>`;

await writeFile(path.join(TMP, "brochure.html"), html);
const url = "file://" + path.join(TMP, "brochure.html");
const base = ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--virtual-time-budget=8000", "--allow-file-access-from-files", `--user-data-dir=${path.join(TMP, "profile")}`];
execFileSync(CHROME, [...base, "--no-pdf-header-footer", `--print-to-pdf=${OUT_PDF}`, url], { stdio: "ignore" });
for (let i = 1; i <= 8; i++) {
  execFileSync(CHROME, [...base, "--window-size=794,560", "--force-device-scale-factor=2", `--screenshot=${path.join(PREVIEW, `page-${i}.png`)}`, `${url}#${i}`], { stdio: "ignore" });
}
const size = (await stat(OUT_PDF)).size;
const pages = (await readFile(OUT_PDF)).toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length;
console.log(`brochure.pdf ${(size / 1048576).toFixed(2)} MB, ${pages} pages -> ${OUT_PDF}`);
