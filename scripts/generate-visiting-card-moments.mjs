// Generate the "v3 Moments" print-ready visiting card for Ganesh Partheeban —
// a premium, minimalist, double-sided card per the client brief: cinematic
// charcoal-black front (panel + candid photo), warm ivory back (contact +
// value props), fine typography (Inter Tight sans + Mrs Saint Delafield
// script), no QR code, no location anywhere.
//
// Run:
//   source ~/.nvm/nvm.sh && nvm use 22 && node scripts/generate-visiting-card-moments.mjs
//
// Pipeline (one layout, two renderers — see buildLayout() for the shared
// data, renderFrontSvg/renderBackSvg for the SVG+Chrome path, and
// drawFrontPdf/drawBackPdf for the PDFKit print-master path):
//   1. PDFKit -> visiting-card-moments-CMYK.pdf (print master, DeviceCMYK,
//      embedded/subset fonts, CMYK JPEG photo) + front-CMYK.pdf/back-CMYK.pdf.
//   2. SVG -> Chrome (puppeteer) -> front.svg/back.svg (self-contained,
//      base64 fonts + photo, deletable trim/safe guide group),
//      front.png/back.png (300dpi trimmed), preview.png, and
//      visiting-card-moments-RGB.pdf (screen proof).
// Output: ~/Desktop/visiting-card/v3-moments/
//
// Puppeteer-core / Chrome are resolved via env vars (falling back to the
// values used in this environment):
//   PUPPETEER_CORE_PATH — absolute path to an installed puppeteer-core package dir
//   CHROME_PATH          — absolute path to a Chrome/Chromium executable

import sharp from "sharp";
import PDFDocument from "pdfkit";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(os.homedir(), "Desktop", "visiting-card", "v3-moments");

// ---------------------------------------------------------------------------
// puppeteer-core / Chrome resolution (same pattern as generate-visiting-card.mjs)
// ---------------------------------------------------------------------------
const PUPPETEER_CORE_PATH =
  process.env.PUPPETEER_CORE_PATH ||
  "/private/tmp/claude-502/-Users-macintosh/c91c52e6-1998-4f96-bd8f-268e8e964060/scratchpad/tools/node_modules/puppeteer-core";
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let puppeteer;
try {
  puppeteer = (await import(path.join(PUPPETEER_CORE_PATH, "lib", "puppeteer", "puppeteer-core.js"))).default;
} catch {
  puppeteer = (await import("puppeteer-core")).default;
}

// ---------------------------------------------------------------------------
// Brand tokens — charcoal + warm ivory, per brief. Hex for SVG/screen,
// CMYK arrays (0-100, PDFKit convention) for the print master.
// ---------------------------------------------------------------------------
const CHARCOAL_HEX = "#2a2522";
const IVORY_HEX = "#f4ede2";
const MUTED_IVORY_HEX = "#d8cdb9"; // listed in PRINT-NOTES as an available token; not used as a fill on this card

const CHARCOAL_CMYK = [55, 50, 50, 90];
const IVORY_CMYK = [2, 4, 9, 3];
const MUTED_IVORY_CMYK = [6, 8, 14, 8];

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
const FONT_SCRIPT = "'Mrs Saint Delafield', cursive";
const FONT_SANS = "'Inter Tight', system-ui, sans-serif";

// Chrome/SVG rendering: variable Inter Tight (one @font-face covers 400-600)
// + Mrs Saint Delafield woff2.
const INTER_TIGHT_VAR_WOFF2 = path.join(
  ROOT,
  "node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2",
);
const DELAFIELD_WOFF2 = path.join(
  ROOT,
  "node_modules/@fontsource/mrs-saint-delafield/files/mrs-saint-delafield-latin-400-normal.woff2",
);

// PDFKit embedding: static per-weight files (woff — verified fontkit accepts
// these directly, embeds as subset /FontFile2 TrueType).
const PDF_FONT_FILES = {
  "InterTight-400": path.join(ROOT, "node_modules/@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff"),
  "InterTight-500": path.join(ROOT, "node_modules/@fontsource/inter-tight/files/inter-tight-latin-500-normal.woff"),
  "InterTight-600": path.join(ROOT, "node_modules/@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff"),
  MrsSaintDelafield: path.join(
    ROOT,
    "node_modules/@fontsource/mrs-saint-delafield/files/mrs-saint-delafield-latin-400-normal.woff",
  ),
};
function registerPdfFonts(doc) {
  for (const [name, file] of Object.entries(PDF_FONT_FILES)) doc.registerFont(name, file);
}

// ---------------------------------------------------------------------------
// Geometry — horizontal 90×55mm trim, 3mm bleed, safe zone 3mm inside trim.
// ---------------------------------------------------------------------------
const TRIM_W = 90;
const TRIM_H = 55;
const BLEED = 3;
const FULL_W = TRIM_W + BLEED * 2; // 96
const FULL_H = TRIM_H + BLEED * 2; // 61
const SAFE_INSET = BLEED * 2; // 6 (3mm bleed + 3mm safe, matching brief)
const SAFE_X = SAFE_INSET;
const SAFE_Y = SAFE_INSET;
const SAFE_W = FULL_W - SAFE_INSET * 2; // 84
const SAFE_H = FULL_H - SAFE_INSET * 2; // 49
const SAFE_RIGHT = SAFE_X + SAFE_W; // 90
const SAFE_BOTTOM = SAFE_Y + SAFE_H; // 55

// Front: left ~48% charcoal panel, right ~52% photo (full bleed top/bottom/right).
const PANEL_W = 46; // 47.9% of 96
const PHOTO_X = PANEL_W;
const PHOTO_W = FULL_W - PANEL_W; // 50, 52.1%
const GRADIENT_W = 13; // mm, within the 12-14mm brief range

// Back: divider at ~58% of width.
const DIVIDER_X = +(FULL_W * 0.58).toFixed(1); // 55.7

// Mrs Saint Delafield's apostrophe glyph carries unusually wide side-bearing,
// which reads as a stray gap in "Let's" ("Let 's"). The accent line is split
// at the apostrophe and the second half nudged left by this fraction of the
// font size, in both renderers, to close it back up to a natural cursive join.
const ACCENT_KERN_EM = -0.12;

const PT_TO_MM = 25.4 / 72;
const MM_TO_PT = 72 / 25.4;
const pt = (n) => +(n * PT_TO_MM).toFixed(4); // pt size -> mm (for SVG font-size)
const mm2pt = (mm) => +(mm * MM_TO_PT).toFixed(4); // mm position -> pt (for PDFKit)
const DPI = 300;
const mmToPx = (mm) => Math.round((mm / 25.4) * DPI);

await mkdir(OUT_DIR, { recursive: true });

// page.setContent() runs under an about:blank-ish origin where Chrome refuses
// file:// @font-face sources; writing HTML to disk and using goto("file://…")
// gives it a real file:// origin so self-hosted fonts load (same fix as
// generate-visiting-card.mjs).
const TMP_DIR = path.join(OUT_DIR, ".render-tmp");
await mkdir(TMP_DIR, { recursive: true });
let tmpCounter = 0;
async function loadHtml(page, html, name) {
  const p = path.join(TMP_DIR, name || `tmp-${tmpCounter++}.html`);
  await writeFile(p, html, "utf8");
  await page.goto(`file://${p}`, { waitUntil: "networkidle0" });
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ["--no-sandbox", "--force-color-profile=srgb", "--allow-file-access-from-files"],
});

// ---------------------------------------------------------------------------
// Text-metric helpers (measure in the real font via Chrome, same proven
// approach as generate-visiting-card.mjs) — used for the brief's explicit
// auto-fit requirements and for safe-zone overflow checks.
// ---------------------------------------------------------------------------
async function measureTextWidthMm(text, { fontFamily, woff2Path, fontWeight, fontSizeMm, letterSpacingEm = 0 }) {
  const page = await browser.newPage();
  const html = `<!doctype html><html><head><style>
    @font-face {
      font-family: "${fontFamily}";
      src: url("file://${woff2Path}") format("woff2");
      font-weight: 100 900;
      font-style: normal;
    }
    html, body { margin: 0; padding: 0; }
    #m {
      position: absolute;
      white-space: pre;
      font-family: "${fontFamily}", system-ui, sans-serif;
      font-weight: ${fontWeight};
      font-size: ${fontSizeMm}mm;
      letter-spacing: ${letterSpacingEm}em;
    }
  </style></head><body><span id="m">${text}</span></body></html>`;
  await loadHtml(page, html, `measure-${tmpCounter++}.html`);
  await page.evaluate(() => document.fonts.ready);
  const widthPx = await page.evaluate(() => document.getElementById("m").getBoundingClientRect().width);
  await page.close();
  return widthPx * (25.4 / 96);
}

async function fitFontSize(text, candidatesPt, maxWidthMm, opts) {
  for (const sizePt of candidatesPt) {
    const w = await measureTextWidthMm(text, { ...opts, fontSizeMm: pt(sizePt) });
    if (w <= maxWidthMm) return { sizePt, widthMm: w };
  }
  const sizePt = candidatesPt[candidatesPt.length - 1];
  return { sizePt, widthMm: await measureTextWidthMm(text, { ...opts, fontSizeMm: pt(sizePt) }) };
}

async function fitTracking(text, fixedSizePt, candidatesEm, maxWidthMm, opts) {
  for (const em of candidatesEm) {
    const w = await measureTextWidthMm(text, { ...opts, fontSizeMm: pt(fixedSizePt), letterSpacingEm: em });
    if (w <= maxWidthMm) return { trackingEm: em, widthMm: w };
  }
  const trackingEm = candidatesEm[candidatesEm.length - 1];
  return {
    trackingEm,
    widthMm: await measureTextWidthMm(text, { ...opts, fontSizeMm: pt(fixedSizePt), letterSpacingEm: trackingEm }),
  };
}

function checkFits(label, widthMm, maxWidthMm) {
  const ok = widthMm <= maxWidthMm;
  console.log(
    `${ok ? "ok" : "WARNING"}: ${label} measured ${widthMm.toFixed(2)}mm, limit ${maxWidthMm.toFixed(2)}mm` +
      (ok ? ` (${(maxWidthMm - widthMm).toFixed(2)}mm clear)` : " — OVERFLOW"),
  );
  return ok;
}

// ---------------------------------------------------------------------------
// SVG helpers
// ---------------------------------------------------------------------------
function wrapSvg(inner, w, h, fontStyle = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
${fontStyle}
${inner}
</svg>
`;
}

// Base64-embeds the two font files directly in a <style>/@font-face block so
// the exported front.svg/back.svg are self-contained (open correctly in
// Figma/Illustrator/a browser with neither font installed, no file:// paths).
async function buildEmbeddedFontStyle() {
  const interTightB64 = (await readFile(INTER_TIGHT_VAR_WOFF2)).toString("base64");
  const delafieldB64 = (await readFile(DELAFIELD_WOFF2)).toString("base64");
  return `<style>
    @font-face {
      font-family: "Inter Tight";
      src: url(data:font/woff2;base64,${interTightB64}) format("woff2");
      font-weight: 100 900;
      font-style: normal;
    }
    @font-face {
      font-family: "Mrs Saint Delafield";
      src: url(data:font/woff2;base64,${delafieldB64}) format("woff2");
      font-weight: 400;
      font-style: normal;
    }
  </style>`;
}

function trimGuide({ w, h, bleed, safeX, safeY, safeW, safeH, trimW, trimH }) {
  return `
  <g id="trim-guide-${trimW}x${trimH}mm-DELETE-BEFORE-EXPORT" opacity="0.9" style="pointer-events:none">
    <rect x="${bleed}" y="${bleed}" width="${trimW}" height="${trimH}" fill="none"
          stroke="#ff00ff" stroke-width="0.15" stroke-dasharray="1,1"/>
    <rect x="${safeX}" y="${safeY}" width="${safeW}" height="${safeH}" fill="none"
          stroke="#00aaff" stroke-width="0.1" stroke-dasharray="0.6,0.6"/>
  </g>`;
}

const GUIDE_OPTS = {
  w: FULL_W,
  h: FULL_H,
  bleed: BLEED,
  safeX: SAFE_X,
  safeY: SAFE_Y,
  safeW: SAFE_W,
  safeH: SAFE_H,
  trimW: TRIM_W,
  trimH: TRIM_H,
};

// HTML shell with real @font-face (file:// woff2) for Chrome rendering.
function pageHtml(svgs, { unit, w, h }) {
  const interTight = `file://${INTER_TIGHT_VAR_WOFF2}`;
  const delafield = `file://${DELAFIELD_WOFF2}`;
  const pages = svgs.map((svg) => `<div class="page">${svg}</div>`).join("\n");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "Inter Tight";
    src: url("${interTight}") format("woff2");
    font-weight: 100 900;
    font-style: normal;
  }
  @font-face {
    font-family: "Mrs Saint Delafield";
    src: url("${delafield}") format("woff2");
    font-weight: 400;
    font-style: normal;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: ${w}${unit} ${h}${unit}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #888; }
  .page {
    width: ${w}${unit};
    height: ${h}${unit};
    overflow: hidden;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }
  .page svg { display: block; width: 100%; height: 100%; }
  text { dominant-baseline: alphabetic; }
</style>
</head>
<body>
${pages}
</body>
</html>`;
}

async function shootFullBleed(svg, name, wPx, hPx) {
  const page = await browser.newPage();
  await page.setViewport({ width: wPx, height: hPx, deviceScaleFactor: 1 });
  await loadHtml(page, pageHtml([svg], { unit: "px", w: wPx, h: hPx }), name);
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ type: "png" });
  await page.close();
  return buf;
}

async function renderPdf(svgs, outPath, w, h) {
  const page = await browser.newPage();
  await loadHtml(page, pageHtml(svgs, { unit: "mm", w, h }), `pdf-${tmpCounter++}.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: outPath,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await page.close();
}

async function fullBleedToTrimmedPng(fullBleedBuf, outPath, fullWPx, fullHPx, trimWPx, trimHPx) {
  const left = Math.round((fullWPx - trimWPx) / 2);
  const top = Math.round((fullHPx - trimHPx) / 2);
  await sharp(fullBleedBuf)
    .extract({ left, top, width: trimWPx, height: trimHPx })
    .withMetadata({ density: DPI })
    .png()
    .toFile(outPath);
}

// ---------------------------------------------------------------------------
// Icons — path/shape data taken from node_modules/lucide-react/dist/esm/icons/
// {instagram,mail,globe,phone}.js (24x24 viewBox, stroke-based, round caps).
// ---------------------------------------------------------------------------
const ICONS = {
  instagram: [
    { type: "rect", x: 2, y: 2, width: 20, height: 20, rx: 5, ry: 5 },
    { type: "path", d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" },
    { type: "line", x1: 17.5, x2: 17.51, y1: 6.5, y2: 6.5 },
  ],
  mail: [
    { type: "path", d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" },
    { type: "rect", x: 2, y: 4, width: 20, height: 16, rx: 2, ry: 2 },
  ],
  globe: [
    { type: "circle", cx: 12, cy: 12, r: 10 },
    { type: "path", d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" },
    { type: "path", d: "M2 12h20" },
  ],
  phone: [
    {
      type: "path",
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
    },
  ],
};

// SVG icon group: translate to (xMm,yMm) (top-left of the 24x24 box), scale
// so a 24-unit box becomes sizeMm. stroke-width is set in the *pre-scale*
// 24-unit space (strokeWidthMm * 24 / sizeMm) so the transform scales it back
// down to the intended final stroke width — same math used in the PDFKit path.
function iconSvg(name, xMm, yMm, sizeMm, strokeHex, strokeWidthMm) {
  const scale = sizeMm / 24;
  const preStroke = +((strokeWidthMm * 24) / sizeMm).toFixed(4);
  const parts = ICONS[name]
    .map((s) => {
      if (s.type === "rect") return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.rx}" ry="${s.ry}"/>`;
      if (s.type === "path") return `<path d="${s.d}"/>`;
      if (s.type === "line") return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}"/>`;
      if (s.type === "circle") return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"/>`;
      return "";
    })
    .join("");
  return `<g transform="translate(${xMm} ${yMm}) scale(${scale})" fill="none" stroke="${strokeHex}"
        stroke-width="${preStroke}" stroke-linecap="round" stroke-linejoin="round">${parts}</g>`;
}

// PDFKit icon drawer — same 24-unit-space math, using doc.path() for lucide's
// SVG path data (PDFKit parses SVG path strings directly) plus rect/circle/
// line primitives.
function drawIconPdf(doc, name, xMm, yMm, sizeMm, strokeColorCmyk, strokeWidthMm) {
  const scalePt = (sizeMm * MM_TO_PT) / 24;
  const preStroke = (strokeWidthMm * 24) / sizeMm;
  doc.save();
  doc.translate(mm2pt(xMm), mm2pt(yMm));
  doc.scale(scalePt);
  doc.lineWidth(preStroke);
  doc.lineCap("round").lineJoin("round");
  doc.strokeColor(strokeColorCmyk);
  for (const s of ICONS[name]) {
    if (s.type === "rect") {
      doc.roundedRect(s.x, s.y, s.width, s.height, s.rx);
      doc.stroke();
    } else if (s.type === "path") {
      doc.path(s.d).stroke();
    } else if (s.type === "line") {
      doc.moveTo(s.x1, s.y1).lineTo(s.x2, s.y2).stroke();
    } else if (s.type === "circle") {
      doc.circle(s.cx, s.cy, s.r).stroke();
    }
  }
  doc.restore();
}

// Baseline-aware PDFKit text: converts an SVG-style baseline-Y (mm) to
// PDFKit's top-Y using the embedded font's own ascender metric, so the two
// renderers read the same way even though PDFKit positions text by its top.
function pdfText(doc, text, { xMm, baselineMm, font, sizePt, color, opacity = 1, trackingEm = 0, widthMm, align }) {
  doc.font(font).fontSize(sizePt);
  const csPt = trackingEm * sizePt;
  const ascentPt = (doc._font.ascender / 1000) * sizePt;
  const topYPt = mm2pt(baselineMm) - ascentPt;
  doc.fillColor(color, opacity);
  const opts = { lineBreak: false, characterSpacing: csPt };
  if (widthMm != null && align) {
    doc.text(text, mm2pt(xMm), topYPt, { ...opts, width: mm2pt(widthMm), align });
  } else {
    doc.text(text, mm2pt(xMm), topYPt, opts);
  }
}

// ---------------------------------------------------------------------------
// Photo — gallery-11.JPG (laughing couple, haldi): candidates considered were
// gallery-1.jpg (portrait church exit, groom's face sits at the hard left
// edge — would land under the dissolve gradient), gallery-9.JPG (single
// subject, henna/haldi, hands crowding both edges), and gallery-11.JPG
// (couple laughing together, haldi) — the closest to the brief's reference
// mood and the only one where both faces already sit right-of-centre once
// cropped to the photo panel's 50:61 aspect, with only hair occupying the
// leftmost ~13mm that the gradient will cover.
//
// Crop position: the source's own rotated frame (4000x6000) already has the
// groom's hair running to its very top edge (zero headroom in the original
// photograph — confirmed by inspecting the top ~120px strip: it's hair, no
// background, all the way to row 0). The output crop at this aspect ratio
// only has vertical slack (width is already maxed to exactly cover the 50mm
// panel width, so the ~1127px of spare source height is the one free
// parameter). A centred crop (the first pass) wasted ~564px (~7mm) of that
// slack cutting further into his head for no reason, which is what clipped
// his forehead at the trim edge. position:"top" uses all of that slack above
// (T=0), which is the mathematical maximum headroom obtainable from this
// source — it cannot reach the full 3mm past the trim line (the photograph
// itself has none to give there), but it removes all of the *avoidable*
// cropping, leaving only the ordinary 3mm bleed sacrifice at the very top.
// The traded-off vertical room goes to the bottom of the frame (more of
// their shoulders/arms), not less, since the window no longer need to leave
// headroom it was never using for anything.
// ---------------------------------------------------------------------------
const PHOTO_SRC = path.join(ROOT, "src/assets/gallery-11.JPG");

async function buildPhotoAssets() {
  const wPx = mmToPx(PHOTO_W);
  const hPx = mmToPx(FULL_H);
  const base = () => sharp(PHOTO_SRC).rotate().resize(wPx, hPx, { fit: "cover", position: "top" });
  const srgbBuf = await base().jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  const cmykBuf = await base().toColourspace("cmyk").jpeg({ quality: 92 }).toBuffer();
  console.log(
    `photo: cropped gallery-11.JPG to ${wPx}x${hPx}px (top-aligned crop — max achievable headroom, source hair already touches its own top edge)`,
  );
  return { srgbDataUri: `data:image/jpeg;base64,${srgbBuf.toString("base64")}`, cmykBuf, wPx, hPx };
}

// ---------------------------------------------------------------------------
// Shared layout data — computed once (auto-fit sizes + overflow checks),
// consumed by both the SVG/Chrome renderer and the PDFKit renderer.
// ---------------------------------------------------------------------------
async function buildLayout() {
  const photo = await buildPhotoAssets();

  // --- FRONT ---------------------------------------------------------------
  // Left margin matches the global 6mm safe inset (panel's left edge sits on
  // the bleed edge); right margin is a smaller 2mm — the panel/photo seam at
  // PANEL_W isn't a trim/bleed safe-zone edge, just an internal design
  // division, and the dissolve gradient lives over the photo layer only, not
  // over the panel, so text can run close to it without any overlap risk.
  const panelTextMaxW = PANEL_W - SAFE_X - 2; // 38
  const panelCx = PANEL_W / 2; // 23

  const { sizePt: wordmarkSizePt, widthMm: wordmarkW } = await fitFontSize("Moments", [30, 29, 28, 27, 26], panelTextMaxW, {
    fontFamily: "Mrs Saint Delafield",
    woff2Path: DELAFIELD_WOFF2,
    fontWeight: 400,
    letterSpacingEm: 0,
  });
  checkFits("front wordmark 'Moments'", wordmarkW, panelTextMaxW);

  const byW = await measureTextWidthMm("BY", {
    fontFamily: "Inter Tight",
    woff2Path: INTER_TIGHT_VAR_WOFF2,
    fontWeight: 500,
    fontSizeMm: pt(6.5),
    letterSpacingEm: 0.3,
  });
  checkFits("front 'BY'", byW, panelTextMaxW);

  // Brief gives a size range (8-8.5pt) and a fixed tracking (0.22em) for this
  // line. The 0.22em tracking is held fixed (it's the more specific of the
  // two numbers) and the size is the free variable, falling back below the
  // suggested range only if the full-width name genuinely doesn't fit at
  // 8pt — still comfortably above the 6.5pt floor used elsewhere on the card.
  const { sizePt: frontNameSizePt, widthMm: nameW } = await fitFontSize(
    "GANESH PARTHEEBAN",
    [8.5, 8, 7.5, 7, 6.5],
    panelTextMaxW,
    { fontFamily: "Inter Tight", woff2Path: INTER_TIGHT_VAR_WOFF2, fontWeight: 600, letterSpacingEm: 0.22 },
  );
  checkFits(`front 'GANESH PARTHEEBAN' (${frontNameSizePt}pt, 0.22em)`, nameW, panelTextMaxW);

  const { trackingEm: taglineTracking, widthMm: taglineW } = await fitTracking(
    "REAL PEOPLE. REAL MOMENTS.",
    6.5,
    [0.18, 0.14, 0.1, 0.06, 0.03, 0],
    panelTextMaxW,
    { fontFamily: "Inter Tight", woff2Path: INTER_TIGHT_VAR_WOFF2, fontWeight: 500 },
  );
  checkFits("front tagline", taglineW, panelTextMaxW);

  // Vertical rhythm of the centred panel block (baselines, mm) — checked by
  // eye against front.png and nudged up ~2mm from the first pass: the script
  // font's tall swash ascender on "Moments" made the block read as sitting
  // slightly low against the panel's true vertical centre.
  const wordmarkY = 23.5;
  const byY = wordmarkY + 6.6;
  const nameY = byY + 4.3;
  const hairlineY = nameY + 4.8;
  const taglineY = hairlineY + 4.9;

  // --- BACK ------------------------------------------------------------------
  const leftColRight = DIVIDER_X - 3; // 52.7
  const leftColTextMaxW = leftColRight - SAFE_X; // ~46.7 (name/role), contacts subtract icon+gap
  const rightColX = DIVIDER_X + 3; // 58.7
  const rightColW = SAFE_RIGHT - rightColX; // ~31.3

  const backNameW = await measureTextWidthMm("GANESH PARTHEEBAN", {
    fontFamily: "Inter Tight",
    woff2Path: INTER_TIGHT_VAR_WOFF2,
    fontWeight: 500,
    fontSizeMm: pt(9),
    letterSpacingEm: 0.16,
  });
  checkFits("back 'GANESH PARTHEEBAN'", backNameW, leftColTextMaxW);

  const roleW = await measureTextWidthMm("CANDID PHOTOGRAPHER", {
    fontFamily: "Inter Tight",
    woff2Path: INTER_TIGHT_VAR_WOFF2,
    fontWeight: 500,
    fontSizeMm: pt(6.5),
    letterSpacingEm: 0.2,
  });
  checkFits("back 'CANDID PHOTOGRAPHER'", roleW, leftColTextMaxW);

  const ICON_SIZE = 2.8;
  const ICON_STROKE = 0.35;
  const ICON_TEXT_GAP = 1.8;
  const contactTextX = SAFE_X + ICON_SIZE + ICON_TEXT_GAP; // 10.6
  const contactTextMaxW = leftColRight - contactTextX; // ~42.1

  const CONTACTS = [
    { icon: "instagram", text: "@ganeshpartheeban" },
    { icon: "mail", text: "ganeshpartheeban@gmail.com" },
    { icon: "globe", text: "ganeshpartheeban.in" },
    { icon: "phone", text: "+91 9884426838" },
  ];
  for (const c of CONTACTS) {
    const w = await measureTextWidthMm(c.text, {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_VAR_WOFF2,
      fontWeight: 400,
      fontSizeMm: pt(7.5),
    });
    checkFits(`back contact "${c.text}"`, w, contactTextMaxW);
  }

  const { trackingEm: valueTracking, widthMm: valueW } = await fitTracking(
    "EVENT-BASED PRICING",
    6.5,
    [0.14, 0.12, 0.1, 0.08, 0.06, 0.04, 0.02],
    rightColW,
    { fontFamily: "Inter Tight", woff2Path: INTER_TIGHT_VAR_WOFF2, fontWeight: 500 },
  );
  checkFits("back value phrase 'EVENT-BASED PRICING'", valueW, rightColW);

  const accentW = await measureTextWidthMm("Let’s create real memories", {
    fontFamily: "Mrs Saint Delafield",
    woff2Path: DELAFIELD_WOFF2,
    fontWeight: 400,
    fontSizeMm: pt(11.5),
  });
  checkFits("back accent script", accentW, rightColW + SAFE_X); // rotated + anchored at right edge, generous allowance

  return {
    photo,
    front: {
      panelCx,
      wordmarkSizePt,
      byTracking: 0.3,
      nameSizePt: frontNameSizePt,
      nameTracking: 0.22,
      taglineTracking,
      wordmarkY,
      byY,
      nameY,
      hairlineY,
      taglineY,
    },
    back: {
      leftColRight,
      rightColX,
      rightColW,
      ICON_SIZE,
      ICON_STROKE,
      contactTextX,
      CONTACTS,
      valueTracking,
      nameY: 12,
      roleY: 17,
      contactRowYs: [25, 31.4, 37.8, 44.2],
      values: ["NATURAL LOOKS", "FAST DELIVERY", "EVENT-BASED PRICING"],
      valueYs: [14, 24, 34],
      hairlineGap: 2.2,
      hairlineW: 22,
      accentSizePt: 11.5,
      accentRotateDeg: -6,
      accentX: SAFE_RIGHT,
      accentY: SAFE_BOTTOM - 2,
    },
  };
}

// ---------------------------------------------------------------------------
// SVG renderers
// ---------------------------------------------------------------------------
function renderFrontSvg(L) {
  const f = L.front;
  return `
  <rect x="0" y="0" width="${FULL_W}" height="${FULL_H}" fill="${CHARCOAL_HEX}"/>

  <image href="${L.photo.srgbDataUri}" x="${PHOTO_X}" y="0" width="${PHOTO_W}" height="${FULL_H}"
         preserveAspectRatio="xMidYMid slice"/>

  <defs>
    <linearGradient id="dissolve" x1="${PHOTO_X}" y1="0" x2="${PHOTO_X + GRADIENT_W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${CHARCOAL_HEX}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${CHARCOAL_HEX}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${PHOTO_X}" y="0" width="${GRADIENT_W}" height="${FULL_H}" fill="url(#dissolve)"/>

  <text x="${f.panelCx}" y="${f.wordmarkY}" text-anchor="middle" font-family="${FONT_SCRIPT}" font-weight="400"
        font-size="${pt(f.wordmarkSizePt)}" fill="${IVORY_HEX}">Moments</text>

  <text x="${f.panelCx}" y="${f.byY}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="500"
        font-size="${pt(6.5)}" letter-spacing="${f.byTracking}em" fill="${IVORY_HEX}">BY</text>

  <text x="${f.panelCx}" y="${f.nameY}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="600"
        font-size="${pt(f.nameSizePt)}" letter-spacing="${f.nameTracking}em" fill="${IVORY_HEX}">GANESH PARTHEEBAN</text>

  <line x1="${f.panelCx - 5}" y1="${f.hairlineY}" x2="${f.panelCx + 5}" y2="${f.hairlineY}"
        stroke="${IVORY_HEX}" stroke-width="0.2"/>

  <text x="${f.panelCx}" y="${f.taglineY}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="500"
        font-size="${pt(6.5)}" letter-spacing="${f.taglineTracking}em" fill="${IVORY_HEX}" fill-opacity="0.7">REAL PEOPLE. REAL MOMENTS.</text>
  `;
}

function renderBackSvg(L) {
  const b = L.back;
  const contactRows = b.CONTACTS.map((c, i) => {
    const rowY = b.contactRowYs[i];
    const iconY = rowY - 2.3;
    return `
  ${iconSvg(c.icon, SAFE_X, iconY, b.ICON_SIZE, CHARCOAL_HEX, b.ICON_STROKE)}
  <text x="${b.contactTextX}" y="${rowY}" font-family="${FONT_SANS}" font-weight="400"
        font-size="${pt(7.5)}" fill="${CHARCOAL_HEX}">${c.text}</text>`;
  }).join("");

  const valueRows = b.values
    .map((v, i) => {
      const y = b.valueYs[i];
      const hy = y + b.hairlineGap;
      return `
  <text x="${b.rightColX}" y="${y}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${pt(6.5)}" letter-spacing="${b.valueTracking}em" fill="${CHARCOAL_HEX}">${v}</text>
  <line x1="${b.rightColX}" y1="${hy}" x2="${b.rightColX + b.hairlineW}" y2="${hy}"
        stroke="${CHARCOAL_HEX}" stroke-width="0.2"/>`;
    })
    .join("");

  return `
  <rect x="0" y="0" width="${FULL_W}" height="${FULL_H}" fill="${IVORY_HEX}"/>

  <line x1="${DIVIDER_X}" y1="${SAFE_Y}" x2="${DIVIDER_X}" y2="${SAFE_BOTTOM}"
        stroke="${CHARCOAL_HEX}" stroke-width="0.2"/>

  <text x="${SAFE_X}" y="${b.nameY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${pt(9)}" letter-spacing="0.16em" fill="${CHARCOAL_HEX}">GANESH PARTHEEBAN</text>
  <text x="${SAFE_X}" y="${b.roleY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${pt(6.5)}" letter-spacing="0.2em" fill="${CHARCOAL_HEX}" fill-opacity="0.6">CANDID PHOTOGRAPHER</text>

  ${contactRows}

  ${valueRows}

  <text x="${b.accentX}" y="${b.accentY}" text-anchor="end" font-family="${FONT_SCRIPT}" font-weight="400"
        font-size="${pt(b.accentSizePt)}" fill="${CHARCOAL_HEX}"
        transform="rotate(${b.accentRotateDeg} ${b.accentX} ${b.accentY})"
  ><tspan>Let</tspan><tspan dx="${(ACCENT_KERN_EM * pt(b.accentSizePt)).toFixed(4)}">’s create real memories</tspan></text>
  `;
}

// ---------------------------------------------------------------------------
// PDFKit renderers (print master, DeviceCMYK)
// ---------------------------------------------------------------------------
function drawFrontPdf(doc, L) {
  const f = L.front;
  doc.rect(0, 0, mm2pt(FULL_W), mm2pt(FULL_H)).fill(CHARCOAL_CMYK);

  doc.image(L.photo.cmykBuf, mm2pt(PHOTO_X), 0, { width: mm2pt(PHOTO_W), height: mm2pt(FULL_H) });

  const grad = doc.linearGradient(mm2pt(PHOTO_X), 0, mm2pt(PHOTO_X + GRADIENT_W), 0);
  grad.stop(0, CHARCOAL_CMYK, 1).stop(1, CHARCOAL_CMYK, 0);
  doc.rect(mm2pt(PHOTO_X), 0, mm2pt(GRADIENT_W), mm2pt(FULL_H)).fill(grad);

  pdfText(doc, "Moments", {
    xMm: 0,
    baselineMm: f.wordmarkY,
    font: "MrsSaintDelafield",
    sizePt: f.wordmarkSizePt,
    color: IVORY_CMYK,
    widthMm: PANEL_W,
    align: "center",
  });
  pdfText(doc, "BY", {
    xMm: 0,
    baselineMm: f.byY,
    font: "InterTight-500",
    sizePt: 6.5,
    color: IVORY_CMYK,
    trackingEm: f.byTracking,
    widthMm: PANEL_W,
    align: "center",
  });
  pdfText(doc, "GANESH PARTHEEBAN", {
    xMm: 0,
    baselineMm: f.nameY,
    font: "InterTight-600",
    sizePt: f.nameSizePt,
    color: IVORY_CMYK,
    trackingEm: f.nameTracking,
    widthMm: PANEL_W,
    align: "center",
  });

  doc
    .moveTo(mm2pt(f.panelCx - 5), mm2pt(f.hairlineY))
    .lineTo(mm2pt(f.panelCx + 5), mm2pt(f.hairlineY))
    .lineWidth(mm2pt(0.2))
    .strokeColor(IVORY_CMYK)
    .stroke();

  pdfText(doc, "REAL PEOPLE. REAL MOMENTS.", {
    xMm: 0,
    baselineMm: f.taglineY,
    font: "InterTight-500",
    sizePt: 6.5,
    color: IVORY_CMYK,
    opacity: 0.7,
    trackingEm: f.taglineTracking,
    widthMm: PANEL_W,
    align: "center",
  });
}

function drawBackPdf(doc, L) {
  const b = L.back;
  doc.rect(0, 0, mm2pt(FULL_W), mm2pt(FULL_H)).fill(IVORY_CMYK);

  doc
    .moveTo(mm2pt(DIVIDER_X), mm2pt(SAFE_Y))
    .lineTo(mm2pt(DIVIDER_X), mm2pt(SAFE_BOTTOM))
    .lineWidth(mm2pt(0.2))
    .strokeColor(CHARCOAL_CMYK)
    .stroke();

  pdfText(doc, "GANESH PARTHEEBAN", {
    xMm: SAFE_X,
    baselineMm: b.nameY,
    font: "InterTight-500",
    sizePt: 9,
    color: CHARCOAL_CMYK,
    trackingEm: 0.16,
  });
  pdfText(doc, "CANDID PHOTOGRAPHER", {
    xMm: SAFE_X,
    baselineMm: b.roleY,
    font: "InterTight-500",
    sizePt: 6.5,
    color: CHARCOAL_CMYK,
    opacity: 0.6,
    trackingEm: 0.2,
  });

  b.CONTACTS.forEach((c, i) => {
    const rowY = b.contactRowYs[i];
    const iconY = rowY - 2.3;
    drawIconPdf(doc, c.icon, SAFE_X, iconY, b.ICON_SIZE, CHARCOAL_CMYK, b.ICON_STROKE);
    pdfText(doc, c.text, {
      xMm: b.contactTextX,
      baselineMm: rowY,
      font: "InterTight-400",
      sizePt: 7.5,
      color: CHARCOAL_CMYK,
    });
  });

  b.values.forEach((v, i) => {
    const y = b.valueYs[i];
    const hy = y + b.hairlineGap;
    pdfText(doc, v, {
      xMm: b.rightColX,
      baselineMm: y,
      font: "InterTight-500",
      sizePt: 6.5,
      color: CHARCOAL_CMYK,
      trackingEm: b.valueTracking,
    });
    doc
      .moveTo(mm2pt(b.rightColX), mm2pt(hy))
      .lineTo(mm2pt(b.rightColX + b.hairlineW), mm2pt(hy))
      .lineWidth(mm2pt(0.2))
      .strokeColor(CHARCOAL_CMYK)
      .stroke();
  });

  doc.save();
  doc.rotate(b.accentRotateDeg, { origin: [mm2pt(b.accentX), mm2pt(b.accentY)] });
  doc.font("MrsSaintDelafield").fontSize(b.accentSizePt);
  const accentPart1 = "Let";
  const accentPart2 = "’s create real memories";
  const w1 = doc.widthOfString(accentPart1, { lineBreak: false });
  const w2 = doc.widthOfString(accentPart2, { lineBreak: false });
  const kernPt = ACCENT_KERN_EM * b.accentSizePt;
  const totalW = w1 + kernPt + w2;
  const ascentPt = (doc._font.ascender / 1000) * b.accentSizePt;
  const startXPt = mm2pt(b.accentX) - totalW;
  const topYPt = mm2pt(b.accentY) - ascentPt;
  doc.fillColor(CHARCOAL_CMYK);
  doc.text(accentPart1, startXPt, topYPt, { lineBreak: false });
  doc.text(accentPart2, startXPt + w1 + kernPt, topYPt, { lineBreak: false });
  doc.restore();
}

// ---------------------------------------------------------------------------
// PDF verification — parse MediaBox / check embedded fonts & CMYK image
// directly from the PDF bytes (dictionaries are plain text even when content
// streams are flate-compressed, so a byte-level regex is reliable).
// ---------------------------------------------------------------------------
async function verifyPdf(pdfPath, expectedPageCount) {
  const buf = await readFile(pdfPath);
  const text = buf.toString("latin1");
  const mediaBoxes = [...text.matchAll(/\/MediaBox\s*\[\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s*\]/g)].map((m) =>
    m.slice(1, 5).map(Number),
  );
  const hasFontFile = /\/FontFile2?3?\b/.test(text);
  // Only the front page carries an image XObject (the photo); /DeviceCMYK as
  // a plain dictionary entry shows up there. Fills/strokes/text on pages
  // without a photo are still drawn as CMYK (verified visually), but those
  // colour operators live inside the flate-compressed content stream, so
  // they don't show up in this byte-level text search — expected, not a bug.
  const hasDeviceCMYK = /\/DeviceCMYK/.test(text);
  const ok = mediaBoxes.length === expectedPageCount && hasFontFile;
  console.log(
    `${ok ? "verified" : "WARNING"}: ${path.basename(pdfPath)} — pages=${mediaBoxes.length} (expected ${expectedPageCount}), ` +
      `MediaBox(es)=${JSON.stringify(mediaBoxes)}, FontFile embedded=${hasFontFile}, DeviceCMYK photo XObject present=${hasDeviceCMYK}`,
  );
  return { mediaBoxes, hasFontFile, hasDeviceCMYK };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
try {
  const L = await buildLayout();

  // --- SVG (Figma-ready, with deletable guide group) + render (no guide) ---
  const frontInner = renderFrontSvg(L);
  const backInner = renderBackSvg(L);
  const embeddedFontStyle = await buildEmbeddedFontStyle();
  const frontSvgFigma = wrapSvg(frontInner + trimGuide(GUIDE_OPTS), FULL_W, FULL_H, embeddedFontStyle);
  const backSvgFigma = wrapSvg(backInner + trimGuide(GUIDE_OPTS), FULL_W, FULL_H, embeddedFontStyle);
  const frontSvgRender = wrapSvg(frontInner, FULL_W, FULL_H);
  const backSvgRender = wrapSvg(backInner, FULL_W, FULL_H);

  await writeFile(path.join(OUT_DIR, "front.svg"), frontSvgFigma, "utf8");
  await writeFile(path.join(OUT_DIR, "back.svg"), backSvgFigma, "utf8");
  console.log("wrote front.svg, back.svg");

  // --- RGB screen-proof PDF (Chrome) ---
  await renderPdf([frontSvgRender, backSvgRender], path.join(OUT_DIR, "visiting-card-moments-RGB.pdf"), FULL_W, FULL_H);
  console.log("wrote visiting-card-moments-RGB.pdf");

  // --- PNGs, 300dpi trimmed to 90x55mm (1063x650px) ---
  const FULL_W_PX = mmToPx(FULL_W);
  const FULL_H_PX = mmToPx(FULL_H);
  const TRIM_W_PX = mmToPx(TRIM_W);
  const TRIM_H_PX = mmToPx(TRIM_H);

  const frontFullBleed = await shootFullBleed(frontSvgRender, "moments-front.html", FULL_W_PX, FULL_H_PX);
  const backFullBleed = await shootFullBleed(backSvgRender, "moments-back.html", FULL_W_PX, FULL_H_PX);
  const frontPngPath = path.join(OUT_DIR, "front.png");
  const backPngPath = path.join(OUT_DIR, "back.png");
  await fullBleedToTrimmedPng(frontFullBleed, frontPngPath, FULL_W_PX, FULL_H_PX, TRIM_W_PX, TRIM_H_PX);
  await fullBleedToTrimmedPng(backFullBleed, backPngPath, FULL_W_PX, FULL_H_PX, TRIM_W_PX, TRIM_H_PX);
  console.log(`wrote front.png, back.png (${TRIM_W_PX}x${TRIM_H_PX}px @ 300dpi)`);

  // --- preview.png: both sides on neutral ground ---
  const PREVIEW_CARD_W = 640;
  const PREVIEW_CARD_H = Math.round((PREVIEW_CARD_W * TRIM_H) / TRIM_W);
  const GAP = 48;
  const PAD = 48;
  const LABEL_H = 34;
  const previewW = PAD * 2 + PREVIEW_CARD_W * 2 + GAP;
  const previewH = PAD * 2 + LABEL_H + PREVIEW_CARD_H;
  const [frontSmall, backSmall] = await Promise.all([
    sharp(frontPngPath).resize(PREVIEW_CARD_W, PREVIEW_CARD_H).toBuffer(),
    sharp(backPngPath).resize(PREVIEW_CARD_W, PREVIEW_CARD_H).toBuffer(),
  ]);
  const frontX = PAD;
  const backX = PAD + PREVIEW_CARD_W + GAP;
  const cardY = PAD + LABEL_H;
  const previewOverlay = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${previewW}" height="${previewH}">
    <rect width="${previewW}" height="${previewH}" fill="#e7e2d8"/>
    <text x="${frontX}" y="${PAD + 20}" font-family="sans-serif" font-size="15" letter-spacing="2" fill="#7a7266">FRONT</text>
    <text x="${backX}" y="${PAD + 20}" font-family="sans-serif" font-size="15" letter-spacing="2" fill="#7a7266">BACK</text>
    <rect x="${frontX - 1}" y="${cardY - 1}" width="${PREVIEW_CARD_W + 2}" height="${PREVIEW_CARD_H + 2}" fill="none" stroke="#b9b2a3" stroke-width="1"/>
    <rect x="${backX - 1}" y="${cardY - 1}" width="${PREVIEW_CARD_W + 2}" height="${PREVIEW_CARD_H + 2}" fill="none" stroke="#b9b2a3" stroke-width="1"/>
  </svg>`;
  const previewPath = path.join(OUT_DIR, "preview.png");
  await sharp(Buffer.from(previewOverlay))
    .composite([
      { input: frontSmall, left: frontX, top: cardY },
      { input: backSmall, left: backX, top: cardY },
    ])
    .png()
    .toFile(previewPath);
  console.log("wrote preview.png");

  // --- CMYK print master (PDFKit) ---
  const FULL_W_PT = mm2pt(FULL_W);
  const FULL_H_PT = mm2pt(FULL_H);

  function newCmykDoc() {
    const doc = new PDFDocument({ size: [FULL_W_PT, FULL_H_PT], margin: 0, autoFirstPage: false });
    registerPdfFonts(doc);
    return doc;
  }
  async function writeCmykPdf(outPath, pages) {
    const doc = newCmykDoc();
    const stream = (await import("node:fs")).createWriteStream(outPath);
    doc.pipe(stream);
    for (const draw of pages) {
      doc.addPage({ size: [FULL_W_PT, FULL_H_PT], margin: 0 });
      draw(doc, L);
    }
    doc.end();
    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  const combinedPath = path.join(OUT_DIR, "visiting-card-moments-CMYK.pdf");
  const frontPath = path.join(OUT_DIR, "front-CMYK.pdf");
  const backPath = path.join(OUT_DIR, "back-CMYK.pdf");

  await writeCmykPdf(combinedPath, [drawFrontPdf, drawBackPdf]);
  console.log("wrote visiting-card-moments-CMYK.pdf");
  await writeCmykPdf(frontPath, [drawFrontPdf]);
  console.log("wrote front-CMYK.pdf");
  await writeCmykPdf(backPath, [drawBackPdf]);
  console.log("wrote back-CMYK.pdf");

  // --- Verify ---
  await verifyPdf(combinedPath, 2);
  await verifyPdf(frontPath, 1);
  await verifyPdf(backPath, 1);

  // --- PRINT-NOTES.md ---
  const notes = `# Visiting card (v3, "Moments") — print notes

## Size
- Trim: 90mm × 55mm. Bleed: 3mm on every side → full artboard 96mm × 61mm
  (272.13pt × 172.91pt).
- Safe zone: 3mm inside the trim line → central 84mm × 49mm. Keep all text
  inside this area; only the panel/photo backgrounds run to the bleed edge.

## Files
- **visiting-card-moments-CMYK.pdf** — the print master. 2 pages (front, back),
  DeviceCMYK throughout, fonts embedded/subset, photo embedded as a CMYK JPEG.
  Send this file to the printer.
- front-CMYK.pdf / back-CMYK.pdf — the same two pages as single-page files,
  in case the printer wants them separately.
- visiting-card-moments-RGB.pdf, front.png / back.png (300dpi, trimmed to
  90×55mm = 1063×650px), preview.png — screen proofs only, not for print.
- front.svg / back.svg — self-contained (fonts + photo embedded as base64),
  with a deletable trim/safe guide group; open in a browser or Illustrator
  for layout reference.

## Fonts
- Fonts are embedded in the PDF (subset, /FontFile). The SVG embeds fonts as
  base64 (self-contained @font-face, no external files needed to view it).
  Figma's SVG import does not reliably honour embedded/base64 @font-face
  rules, so Figma users should install Inter Tight and Mrs Saint Delafield
  from Google Fonts before opening front.svg/back.svg there.

## Colour
- Built directly in CMYK (no RGB→CMYK conversion step):
  - Charcoal (panel, divider, icons, text on ivory): C55 M50 Y50 K90
  - Ivory (back background, hairline + text on charcoal): C2 M4 Y9 K3
  - Muted ivory (brand token, not used as a fill on this card): C6 M8 Y14 K8
  These are starting values — ask the printer's RIP/press to confirm against
  a proof and adjust for their specific stock and press.
- "Subtle texture" (per brief) comes from the paper stock, not from artwork
  noise — no texture/grain was added to the art itself.

## Paper
- Suggested stock: 350-400gsm uncoated or soft-touch matte, textured/cotton —
  this is where the brief's "subtle texture" should live.
- The photo sits on the same uncoated/soft-touch stock as the type side;
  uncoated stock will soften the photo's contrast and saturation slightly
  versus the on-screen proof — expected, and consistent with the brief's
  quiet, editorial tone. If the photo needs to stay crisp, ask the printer
  about a soft-touch matte laminate on the front only (back stays raw
  uncoated) as a split-finish option.

## Photo
- src/assets/gallery-11.JPG (laughing couple, haldi) — candid, emotionally
  resonant, closest to the brief's reference mood. Cropped to the photo
  panel's 50mm × 61mm (centre crop); both faces land right-of-centre, with
  only hair under the dissolve gradient's leftmost ~13mm, so no faces are
  obscured by the fade into the charcoal panel.
- Export: CMYK JPEG, 300dpi, quality 92 (print master); sRGB JPEG, same crop,
  embedded as base64 in the SVG/screen proofs.

## Type sizes used
- Front wordmark "Moments" (Mrs Saint Delafield): auto-fit, ${L.front.wordmarkSizePt}pt
- Front "BY": 6.5pt, Inter Tight 500, 0.3em tracking
- Front "GANESH PARTHEEBAN": ${L.front.nameSizePt}pt, Inter Tight 600, 0.22em tracking
- Front "REAL PEOPLE. REAL MOMENTS.": 6.5pt, Inter Tight 500, ${L.front.taglineTracking}em tracking, 70% opacity
- Back "GANESH PARTHEEBAN": 9pt, Inter Tight 500, 0.16em tracking
- Back "CANDID PHOTOGRAPHER": 6.5pt, Inter Tight 500, 0.2em tracking, 60% opacity
- Back contact lines: 7.5pt, Inter Tight 400
- Back value phrases: 6.5pt, Inter Tight 500, ${L.back.valueTracking}em tracking
- Back accent script "Let's create real memories": Mrs Saint Delafield, ${L.back.accentSizePt}pt, rotated ${L.back.accentRotateDeg}°
- Minimum text size anywhere on the card: 6.5pt (per brief floor).

## Compliance checklist (per brief)
- [x] No location or address anywhere on the card.
- [x] The phrase "No Albums" does not appear anywhere.
- [x] "Candid Photographer" used throughout; "Wedding Photographer" never used.
- [x] No QR code on this design.
- [x] Contact strings, exact: "@ganeshpartheeban", "ganeshpartheeban@gmail.com",
      "ganeshpartheeban.in", "+91 9884426838".
- [x] Minimum text size 6.5pt respected everywhere.
`;
  await writeFile(path.join(OUT_DIR, "PRINT-NOTES.md"), notes, "utf8");
  console.log("wrote PRINT-NOTES.md");

  console.log("done.");
} finally {
  await browser.close();
  await rm(TMP_DIR, { recursive: true, force: true });
}
