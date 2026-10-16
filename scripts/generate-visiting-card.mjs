// Generate print-ready visiting cards for Ganesh Partheeban, derived from the
// site's design system (src/styles.css tokens + Fraunces / Inter Tight
// self-hosted fonts + public/logo.svg monogram).
//
// Two designs live here:
//   v2 (default) — vertical 55×90mm "collectible series" card: six photo
//                   fronts (one per case-study cover image) sharing one
//                   typographic back. Writes directly into ~/Desktop/visiting-card/.
//   v1 (--v1 flag) — the original horizontal 90×55mm card (logo + name on
//                   cream, contact block + QR on ink). Writes into
//                   ~/Desktop/visiting-card/v1-horizontal/.
//
// Run:
//   source ~/.nvm/nvm.sh && nvm use 22 && node scripts/generate-visiting-card.mjs        # v2
//   source ~/.nvm/nvm.sh && nvm use 22 && node scripts/generate-visiting-card.mjs --v1   # v1
//
// Pipeline (both designs): build each page as a raw SVG string (mm-unit
// viewBox matching the physical card), embed it in a minimal HTML page with
// @font-face rules that point at this repo's self-hosted woff2 files via
// file:// URLs so Chrome renders the real fonts, then use puppeteer-core for
// PDF (two or more @page-sized pages) and screenshots, with sharp handling
// bleed-trim crops, photo smart-crops, and the contact-sheet preview
// composite. Column/line widths that depend on actual glyph metrics (the
// back's contact block, v2's two-line name, v2's tracked labels) are measured
// in a throwaway Chrome page in the real font rather than guessed, then used
// to fix x-positions / pick a font size that fits.
//
// Puppeteer-core / Chrome are resolved via env vars (falling back to the
// values used in this environment) so the script also works unmodified
// elsewhere:
//   PUPPETEER_CORE_PATH — absolute path to an installed puppeteer-core package dir
//   CHROME_PATH          — absolute path to a Chrome/Chromium executable

import sharp from "sharp";
import QRCode from "qrcode";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(os.homedir(), "Desktop", "visiting-card");

// ---------------------------------------------------------------------------
// puppeteer-core / Chrome resolution
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
// Brand tokens (hex approximations of the oklch tokens in src/styles.css).
// Shared by both designs — no new colours, no new fonts.
// ---------------------------------------------------------------------------
const CREAM = "#f4ede2"; // --background oklch(0.972 0.008 80)
const CREAM_DIM = "#d8cdb9"; // muted cream
const INK = "#2a2522"; // --foreground oklch(0.18 0.012 60)
const INK_MUTED = "#6f6557"; // --muted-foreground oklch(0.45 0.012 60), derived
const ACCENT = "#a85a30"; // --accent oklch(0.55 0.09 40)

const FONT_DISPLAY = "Fraunces, 'Cormorant Garamond', Georgia, serif";
const FONT_SANS = "'Inter Tight', system-ui, sans-serif";

const FRAUNCES_WOFF2 = path.join(
  ROOT,
  "node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
);
const INTER_TIGHT_WOFF2 = path.join(
  ROOT,
  "node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2",
);

const PT_TO_MM = 25.4 / 72;
const PX_TO_MM = 25.4 / 96; // CSS px (96dpi) -> mm
const pt = (n) => +(n * PT_TO_MM).toFixed(4);
const DPI = 300;
const mmToPx = (mm) => Math.round((mm / 25.4) * DPI);

const QR_URL = "https://ganeshpartheeban.in/";

await mkdir(OUT_DIR, { recursive: true });

// page.setContent() runs pages at an about:blank-ish origin, under which
// Chrome refuses to load file:// @font-face sources even with
// --allow-file-access-from-files (that flag only helps file://-to-file://
// navigation). Writing the HTML to disk and using page.goto("file://…")
// gives the page a real file:// origin, so the self-hosted woff2 files load.
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
// Shared helpers
// ---------------------------------------------------------------------------

// Measure the real rendered width (mm) of a string in a given font/weight/
// size/tracking, using the actual self-hosted font file — so column widths
// and "does this fit" decisions come from Chrome's own text metrics rather
// than hand-guessed character widths.
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
  return widthPx * PX_TO_MM;
}

// Pick the largest font size (pt) from `candidatesPt` (largest first) whose
// measured width fits within `maxWidthMm`; falls back to the smallest.
async function fitFontSize(text, candidatesPt, maxWidthMm, opts) {
  for (const sizePt of candidatesPt) {
    const w = await measureTextWidthMm(text, { ...opts, fontSizeMm: pt(sizePt) });
    if (w <= maxWidthMm) return { sizePt, widthMm: w };
  }
  const sizePt = candidatesPt[candidatesPt.length - 1];
  return { sizePt, widthMm: await measureTextWidthMm(text, { ...opts, fontSizeMm: pt(sizePt) }) };
}

// Pick the largest letter-spacing (em) from `candidatesEm` (largest first,
// i.e. most tracked) whose measured width fits within `maxWidthMm` at a
// fixed font size; falls back to the tightest tracking.
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

// Monogram mark (hairline frame + Fraunces "M" + accent dot), a simplified,
// small-size-friendly derivative of public/logo.svg's roundel (dropping its
// wordmark + corner ticks, which don't hold up at a few mm). `outline` adds a
// thin ink stroke behind the cream version so it stays legible over a photo
// of any tone — a stroke, not a shadow/gradient.
function monogram(x, y, size, { frame, letter, dot, outline }) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const outlineFrame = outline
    ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="${outline}" stroke-width="0.5" opacity="0.5"/>`
    : "";
  const letterStroke = outline ? ` stroke="${outline}" stroke-width="0.35" paint-order="stroke fill"` : "";
  const dotStroke = outline ? ` stroke="${outline}" stroke-width="0.12"` : "";
  return `
  <g>
    ${outlineFrame}
    <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none"
          stroke="${frame}" stroke-width="0.18" opacity="0.8"/>
    <text x="${cx}" y="${cy + size * 0.165}" text-anchor="middle"
          font-family="${FONT_DISPLAY}" font-weight="500" font-size="${size * 0.62}"
          fill="${letter}"${letterStroke}>M</text>
    <circle cx="${cx + size * 0.235}" cy="${cy - size * 0.17}" r="${size * 0.045}" fill="${dot}"${dotStroke}/>
  </g>`;
}

// QR module rects only (no panel/background) — the `qrcode` library's own
// matrix for `url`, drawn as exactly-tiled <rect>s (shared edge coordinates
// so there are no anti-aliasing seams between adjacent modules). Caller
// draws whatever sits behind it (card background for dark-on-light-bg cards,
// or an explicit panel rect for a light panel on a dark card).
function qrModuleRects(url, { blockX, blockY, blockSize, fill, quiet = 4 }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data; // Uint8Array, row-major, 1 = dark module
  const moduleSize = blockSize / (n + quiet * 2);
  const edgeX = (i) => +(blockX + i * moduleSize).toFixed(4);
  const edgeY = (i) => +(blockY + i * moduleSize).toFixed(4);
  let rects = "";
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!data[row * n + col]) continue;
      const x0 = edgeX(quiet + col);
      const x1 = edgeX(quiet + col + 1);
      const y0 = edgeY(quiet + row);
      const y1 = edgeY(quiet + row + 1);
      rects += `<rect x="${x0}" y="${y0}" width="${(x1 - x0).toFixed(4)}" height="${(y1 - y0).toFixed(4)}" fill="${fill}"/>`;
    }
  }
  return { svg: `<g shape-rendering="crispEdges">${rects}</g>`, n, moduleSize, codeAreaMm: n * moduleSize };
}

function wrapSvg(inner, w, h) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
${inner}
</svg>
`;
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

// HTML shell with real @font-face (file:// woff2) for Chrome rendering.
// `unit`/`w`/`h` switch between the mm-based PDF pass and the px-based
// screenshot pass without duplicating the font/page plumbing.
function pageHtml(svgs, { unit, w, h }) {
  const fraunces = `file://${FRAUNCES_WOFF2}`;
  const interTight = `file://${INTER_TIGHT_WOFF2}`;
  const pages = svgs.map((svg) => `<div class="page">${svg}</div>`).join("\n");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "Fraunces";
    src: url("${fraunces}") format("woff2");
    font-weight: 100 900;
    font-style: normal;
  }
  @font-face {
    font-family: "Inter Tight";
    src: url("${interTight}") format("woff2");
    font-weight: 100 900;
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

// ===========================================================================
// v1 — horizontal 90×55mm card (logo + name on cream / contact + QR on ink)
// ===========================================================================
async function runV1(outDir) {
  await mkdir(outDir, { recursive: true });

  const TRIM_W = 90;
  const TRIM_H = 55;
  const BLEED = 3;
  const FULL_W = TRIM_W + BLEED * 2; // 96
  const FULL_H = TRIM_H + BLEED * 2; // 61
  const SAFE_INSET = BLEED * 2; // 6
  const SAFE_X = SAFE_INSET;
  const SAFE_Y = SAFE_INSET;
  const SAFE_W = FULL_W - SAFE_INSET * 2; // 84
  const SAFE_H = FULL_H - SAFE_INSET * 2; // 49
  const SAFE_RIGHT = SAFE_X + SAFE_W; // 90
  const SAFE_BOTTOM = SAFE_Y + SAFE_H; // 55

  function frontArt() {
    const logoSize = 9;
    const nameSize = pt(25);
    const nameY = 35;
    const roleSize = pt(7);
    const roleY = nameY + 6.4;
    const ruleY = SAFE_BOTTOM - 5.5;
    const bottomSize = pt(6.5);
    const bottomY = SAFE_BOTTOM - 1.6;

    return `
  <rect x="0" y="0" width="${FULL_W}" height="${FULL_H}" fill="${CREAM}"/>

  ${monogram(SAFE_X, SAFE_Y, logoSize, { frame: INK, letter: INK, dot: ACCENT })}

  <text x="${SAFE_X}" y="${nameY}" font-family="${FONT_DISPLAY}" font-weight="500"
        font-size="${nameSize}" letter-spacing="-0.01em" fill="${INK}">Ganesh Partheeban</text>

  <text x="${SAFE_X}" y="${roleY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${roleSize}" letter-spacing="0.22em" fill="${ACCENT}">CANDID PHOTOGRAPHER</text>

  <line x1="${SAFE_X}" y1="${ruleY}" x2="${SAFE_RIGHT}" y2="${ruleY}"
        stroke="${INK}" stroke-width="0.12" opacity="0.28"/>

  <text x="${SAFE_X}" y="${bottomY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${bottomSize}" letter-spacing="0.2em" fill="${INK_MUTED}">CHENNAI · TAMIL NADU · INDIA</text>
  `;
  }

  async function backArt() {
    const wordmarkSize = pt(7.5);
    const wordmarkY = 12;
    const ruleY = 14.4;

    const labelSize = pt(6.5);
    const valueSize = pt(8);
    const labelX = SAFE_X;
    const rowYs = [23, 30.2, 37.4, 44.6];
    const rows = [
      ["WEB", "ganeshpartheeban.in"],
      ["EMAIL", "ganeshpartheeban@gmail.com"],
      ["WHATSAPP", "+91 98844 26838"],
      ["INSTAGRAM", "@ganeshpartheeban"],
    ];

    const widestLabelMm = await measureTextWidthMm("INSTAGRAM", {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_WOFF2,
      fontWeight: 600,
      fontSizeMm: labelSize,
      letterSpacingEm: 0.18,
    });
    const LABEL_VALUE_GAP = 3.2;
    const dotX = +(labelX + widestLabelMm + LABEL_VALUE_GAP / 2).toFixed(3);
    const valueX = +(labelX + widestLabelMm + LABEL_VALUE_GAP).toFixed(3);

    const contactRows = rows
      .map(
        ([label, value], i) => `
  <text x="${labelX}" y="${rowYs[i]}" font-family="${FONT_SANS}" font-weight="600"
        font-size="${labelSize}" letter-spacing="0.18em" fill="${CREAM_DIM}">${label}</text>
  <text x="${dotX}" y="${rowYs[i]}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="500"
        font-size="${labelSize}" fill="${CREAM_DIM}">·</text>
  <text x="${valueX}" y="${rowYs[i]}" font-family="${FONT_SANS}" font-weight="400"
        font-size="${valueSize}" letter-spacing="0" fill="${CREAM}">${value}</text>`,
      )
      .join("");

    const blockSize = 24;
    const blockX = SAFE_RIGHT - blockSize;
    const blockY = 19;
    const { svg: qrSvg } = qrModuleRects(QR_URL, { blockX, blockY, blockSize, fill: CREAM });

    const emailValueWidthMm = await measureTextWidthMm("ganeshpartheeban@gmail.com", {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_WOFF2,
      fontWeight: 400,
      fontSizeMm: valueSize,
    });
    const emailValueRight = valueX + emailValueWidthMm;
    console.log(
      emailValueRight > blockX - 1
        ? `warning: v1 EMAIL value right edge (${emailValueRight.toFixed(2)}mm) is close to/over the QR quiet zone (starts ${blockX}mm)`
        : `v1 contact column check: EMAIL value ends at ${emailValueRight.toFixed(2)}mm, QR block starts at ${blockX}mm (${(blockX - emailValueRight).toFixed(2)}mm clear)`,
    );

    const captionSize = pt(6.5);
    const captionY = blockY + blockSize + 3.6;
    const captionCx = blockX + blockSize / 2;

    return `
  <rect x="0" y="0" width="${FULL_W}" height="${FULL_H}" fill="${INK}"/>

  <text x="${SAFE_X}" y="${wordmarkY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${wordmarkSize}" letter-spacing="0.22em" fill="${CREAM}">MOMENTS BY GANESH PARTHEEBAN</text>
  <line x1="${SAFE_X}" y1="${ruleY}" x2="${SAFE_X + 34}" y2="${ruleY}"
        stroke="${ACCENT}" stroke-width="0.25" opacity="0.9"/>

  ${contactRows}

  ${qrSvg}
  <text x="${captionCx}" y="${captionY}" text-anchor="middle" font-family="${FONT_SANS}"
        font-weight="500" font-size="${captionSize}" letter-spacing="0.14em" fill="${CREAM_DIM}">SCAN TO VIEW WORK</text>
  `;
  }

  const guideOpts = { w: FULL_W, h: FULL_H, bleed: BLEED, safeX: SAFE_X, safeY: SAFE_Y, safeW: SAFE_W, safeH: SAFE_H, trimW: TRIM_W, trimH: TRIM_H };
  const frontInner = frontArt();
  const backInner = await backArt();

  const frontSvgFigma = wrapSvg(frontInner + trimGuide(guideOpts), FULL_W, FULL_H);
  const backSvgFigma = wrapSvg(backInner + trimGuide(guideOpts), FULL_W, FULL_H);
  const frontSvgRender = wrapSvg(frontInner, FULL_W, FULL_H);
  const backSvgRender = wrapSvg(backInner, FULL_W, FULL_H);

  await writeFile(path.join(outDir, "front.svg"), frontSvgFigma, "utf8");
  await writeFile(path.join(outDir, "back.svg"), backSvgFigma, "utf8");
  console.log("v1: wrote front.svg, back.svg");

  const pdfPath = path.join(outDir, "visiting-card-print.pdf");
  await renderPdf([frontSvgRender, backSvgRender], pdfPath, FULL_W, FULL_H);
  console.log(`v1: wrote ${pdfPath}`);

  const FULL_W_PX = mmToPx(FULL_W);
  const FULL_H_PX = mmToPx(FULL_H);
  const TRIM_W_PX = mmToPx(TRIM_W);
  const TRIM_H_PX = mmToPx(TRIM_H);

  const frontFullBleed = await shootFullBleed(frontSvgRender, "v1-front.html", FULL_W_PX, FULL_H_PX);
  const backFullBleed = await shootFullBleed(backSvgRender, "v1-back.html", FULL_W_PX, FULL_H_PX);

  const frontPngPath = path.join(outDir, "front.png");
  const backPngPath = path.join(outDir, "back.png");
  await fullBleedToTrimmedPng(frontFullBleed, frontPngPath, FULL_W_PX, FULL_H_PX, TRIM_W_PX, TRIM_H_PX);
  await fullBleedToTrimmedPng(backFullBleed, backPngPath, FULL_W_PX, FULL_H_PX, TRIM_W_PX, TRIM_H_PX);
  console.log(`v1: wrote ${frontPngPath}`);
  console.log(`v1: wrote ${backPngPath}`);

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
  const previewPath = path.join(outDir, "preview.png");
  await sharp(Buffer.from(previewOverlay))
    .composite([
      { input: frontSmall, left: frontX, top: cardY },
      { input: backSmall, left: backX, top: cardY },
    ])
    .png()
    .toFile(previewPath);
  console.log(`v1: wrote ${previewPath}`);

  const notes = `# Visiting card (v1, horizontal) — print notes

## Size
- Trim: 90mm × 55mm. Bleed: 3mm on every side → full artboard 96mm × 61mm.
- Safe zone: 3mm inside the trim line → central 84mm × 49mm.

## Color
- RGB only — ask the printer to convert to CMYK, or request a CMYK proof.

## Paper
- Suggested stock: 300–350gsm matte or uncoated, textured.

## QR code
- Target URL: ${QR_URL}. Error correction M. Cream modules on ink background
  (inverted polarity), 4-module quiet zone, ≥16mm code area.

## Fonts
- Fraunces (display/name), Inter Tight (labels/body) — both self-hosted,
  resolved by family name only in the .svg files (on Google Fonts for Figma).

See v2's PRINT-NOTES.md (one level up) for the current primary design.
`;
  await writeFile(path.join(outDir, "PRINT-NOTES.md"), notes, "utf8");
  console.log(`v1: wrote ${path.join(outDir, "PRINT-NOTES.md")}`);
}

// ===========================================================================
// v2 — vertical 55×90mm collectible series card
//   Photo side ×6 (one per case-study cover) + one shared typographic back.
// ===========================================================================
async function runV2(outDir) {
  await mkdir(outDir, { recursive: true });

  const TRIM_W = 55;
  const TRIM_H = 90;
  const BLEED = 3;
  const FULL_W = TRIM_W + BLEED * 2; // 61
  const FULL_H = TRIM_H + BLEED * 2; // 96
  const SAFE_INSET = BLEED * 2; // 6
  const SAFE_X = SAFE_INSET;
  const SAFE_Y = SAFE_INSET;
  const SAFE_W = FULL_W - SAFE_INSET * 2; // 49
  const SAFE_H = FULL_H - SAFE_INSET * 2; // 84
  const SAFE_RIGHT = SAFE_X + SAFE_W; // 55
  const SAFE_BOTTOM = SAFE_Y + SAFE_H; // 90

  const FULL_W_PX = mmToPx(FULL_W); // 720
  const FULL_H_PX = mmToPx(FULL_H); // 1134
  const TRIM_W_PX = mmToPx(TRIM_W); // 650
  const TRIM_H_PX = mmToPx(TRIM_H); // 1063

  const guideOpts = { w: FULL_W, h: FULL_H, bleed: BLEED, safeX: SAFE_X, safeY: SAFE_Y, safeW: SAFE_W, safeH: SAFE_H, trimW: TRIM_W, trimH: TRIM_H };

  // Six story covers, in the same order as scripts/generate-og.mjs.
  const PHOTOS = [
    { n: 1, title: "Mevlin weds Nikhil" },
    { n: 9, title: "Swati weds Sushin" },
    { n: 11, title: "Bhavana weds Jayanth" },
    { n: 5, title: "Theyyam" },
    { n: 2, title: "Agam Concert" },
    { n: 30, title: "Concerts & Events" },
  ];

  function findPhotoSource(n) {
    const candidates = [
      path.join(ROOT, `src/assets/gallery-${n}.jpg`),
      path.join(ROOT, `src/assets/gallery-${n}.JPG`),
      path.join(ROOT, `src/assets/gallery-${n}.jpeg`),
      path.join(ROOT, `public/gallery-full/g${n}.jpg`),
    ];
    for (const c of candidates) if (existsSync(c)) return c;
    throw new Error(`No source photo found for gallery #${n}`);
  }

  async function photoDataUri(srcPath, wPx, hPx) {
    const buf = await sharp(srcPath)
      .rotate() // respect EXIF orientation before cropping
      .resize(wPx, hPx, { fit: "cover", position: "attention" })
      .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  }

  // --- PHOTO SIDE -----------------------------------------------------------
  async function photoArt(index, dataUri) {
    const idxLabel = `No. ${String(index + 1).padStart(2, "0")} / 06`;
    const logoSize = 8;
    const gradTop = 60; // mm, full-bleed coords — a little more than the bottom third, for legibility
    const nameSize = pt(15);
    // Index No. sits on its own line under the role label — sharing a
    // baseline with "CANDID PHOTOGRAPHER" collided on this narrow (49mm
    // safe-width) format, so the two are stacked instead of side-by-side.
    const nameY = SAFE_BOTTOM - 14; // 76
    const roleY = nameY + 6; // 82
    const indexY = roleY + 5; // 87
    const indexSize = pt(6.5);

    const { sizePt: roleSizePt } = await fitFontSize("CANDID PHOTOGRAPHER", [7, 6.5], SAFE_W - 2, {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_WOFF2,
      fontWeight: 500,
      letterSpacingEm: 0.2,
    });
    const roleSize = pt(roleSizePt);

    return `
  <image href="${dataUri}" x="0" y="0" width="${FULL_W}" height="${FULL_H}" preserveAspectRatio="xMidYMid slice"/>

  <defs>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="55%" stop-color="${INK}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${gradTop}" width="${FULL_W}" height="${FULL_H - gradTop}" fill="url(#bottomFade)"/>

  ${monogram(SAFE_X, SAFE_Y, logoSize, { frame: CREAM, letter: CREAM, dot: ACCENT, outline: INK })}

  <text x="${SAFE_X}" y="${nameY}" font-family="${FONT_DISPLAY}" font-weight="500"
        font-size="${nameSize}" letter-spacing="-0.01em" fill="${CREAM}">Ganesh Partheeban</text>
  <text x="${SAFE_X}" y="${roleY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${roleSize}" letter-spacing="0.2em" fill="${CREAM}">CANDID PHOTOGRAPHER</text>
  <text x="${SAFE_RIGHT}" y="${indexY}" text-anchor="end" font-family="${FONT_SANS}" font-weight="500"
        font-size="${indexSize}" letter-spacing="0.08em" fill="${CREAM_DIM}">${idxLabel}</text>
  `;
  }

  // --- TYPE SIDE (identical on all six) -------------------------------------
  async function typeArt() {
    // Name: "Ganesh" / "Partheeban", sized to fill the safe width (22-26pt).
    const { sizePt: nameSizePt } = await fitFontSize("Partheeban", [26, 25, 24, 23, 22], SAFE_W - 2, {
      fontFamily: "Fraunces",
      woff2Path: FRAUNCES_WOFF2,
      fontWeight: 500,
      letterSpacingEm: -0.01,
    });
    const nameSize = pt(nameSizePt);
    const line1Y = 6 + nameSize * 0.8;
    const line2Y = line1Y + nameSize * 1.08;
    const ruleY = line2Y + nameSize * 0.42;
    const ruleW = 26;

    // Role label: fit "CANDID PHOTOGRAPHER · CHENNAI" at 7pt, else 6.5pt.
    const { sizePt: roleSizePt } = await fitFontSize("CANDID PHOTOGRAPHER · CHENNAI", [7, 6.5], SAFE_W - 1, {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_WOFF2,
      fontWeight: 500,
      letterSpacingEm: 0.15,
    });
    const roleSize = pt(roleSizePt);
    const roleY = ruleY + 4.3;

    // Contact block: two fixed columns, no separator dots. Column split is
    // sized to the measured width of "INSTAGRAM" (the widest label).
    const labelSize = pt(6.5);
    const valueSize = pt(6.5);
    const labelX = SAFE_X;
    const rows = [
      ["WEB", "ganeshpartheeban.in"],
      ["EMAIL", "ganeshpartheeban@gmail.com"],
      ["WHATSAPP", "+91 98844 26838"],
      ["INSTAGRAM", "@ganeshpartheeban"],
    ];
    const rowYs = [40, 45, 50, 55];
    const widestLabelMm = await measureTextWidthMm("INSTAGRAM", {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_WOFF2,
      fontWeight: 600,
      fontSizeMm: labelSize,
      letterSpacingEm: 0.06,
    });
    const COL_GAP = 1.8;
    const valueX = +(labelX + widestLabelMm + COL_GAP).toFixed(3);

    const contactRows = rows
      .map(
        ([label, value], i) => `
  <text x="${labelX}" y="${rowYs[i]}" font-family="${FONT_SANS}" font-weight="600"
        font-size="${labelSize}" letter-spacing="0.06em" fill="${CREAM_DIM}">${label}</text>
  <text x="${valueX}" y="${rowYs[i]}" font-family="${FONT_SANS}" font-weight="400"
        font-size="${valueSize}" letter-spacing="0" fill="${CREAM}">${value}</text>`,
      )
      .join("");

    const emailWidthMm = await measureTextWidthMm("ganeshpartheeban@gmail.com", {
      fontFamily: "Inter Tight",
      woff2Path: INTER_TIGHT_WOFF2,
      fontWeight: 400,
      fontSizeMm: valueSize,
    });
    const emailRight = valueX + emailWidthMm;
    console.log(
      emailRight > SAFE_RIGHT - 1
        ? `warning: v2 EMAIL value right edge (${emailRight.toFixed(2)}mm) is close to/over the safe right edge (${SAFE_RIGHT}mm)`
        : `v2 contact column check: EMAIL value ends at ${emailRight.toFixed(2)}mm, safe right edge at ${SAFE_RIGHT}mm (${(SAFE_RIGHT - emailRight).toFixed(2)}mm clear)`,
    );

    // QR: standard dark-on-light polarity — a cream panel, ink modules.
    const panel = 21; // mm, incl. quiet zone — code area comes out >16mm
    const panelTop = 60;
    const panelLeft = (FULL_W - panel) / 2;
    const panelBottom = panelTop + panel;
    const { svg: qrSvg, codeAreaMm } = qrModuleRects(QR_URL, {
      blockX: panelLeft,
      blockY: panelTop,
      blockSize: panel,
      fill: INK,
    });
    console.log(`v2 QR code area: ${codeAreaMm.toFixed(2)}mm (panel ${panel}mm incl. quiet zone)`);

    const captionSize = pt(6.5);
    const captionY = panelBottom + 3.3;

    // Wordmark: fixed at 6.5pt per spec — tracking is the free variable to
    // keep "MOMENTS BY GANESH PARTHEEBAN" inside the (narrow) safe width.
    const { trackingEm: wordmarkTracking } = await fitTracking(
      "MOMENTS BY GANESH PARTHEEBAN",
      6.5,
      [0.18, 0.12, 0.08, 0.05, 0.02, 0],
      SAFE_W - 2,
      { fontFamily: "Inter Tight", woff2Path: INTER_TIGHT_WOFF2, fontWeight: 500 },
    );
    const wordmarkY = captionY + 3.2;

    console.log(
      `v2 bottom cluster: panel ${panelTop.toFixed(1)}–${panelBottom.toFixed(1)}mm, caption ${captionY.toFixed(1)}mm, wordmark ${wordmarkY.toFixed(1)}mm (safe bottom ${SAFE_BOTTOM}mm)`,
    );

    return `
  <rect x="0" y="0" width="${FULL_W}" height="${FULL_H}" fill="${INK}"/>

  <text x="${SAFE_X}" y="${line1Y}" font-family="${FONT_DISPLAY}" font-weight="500"
        font-size="${nameSize}" letter-spacing="-0.01em" fill="${CREAM}">Ganesh</text>
  <text x="${SAFE_X}" y="${line2Y}" font-family="${FONT_DISPLAY}" font-weight="500"
        font-size="${nameSize}" letter-spacing="-0.01em" fill="${CREAM}">Partheeban</text>

  <line x1="${SAFE_X}" y1="${ruleY}" x2="${SAFE_X + ruleW}" y2="${ruleY}"
        stroke="${ACCENT}" stroke-width="0.3" opacity="0.9"/>

  <text x="${SAFE_X}" y="${roleY}" font-family="${FONT_SANS}" font-weight="500"
        font-size="${roleSize}" letter-spacing="0.15em" fill="${ACCENT}">CANDID PHOTOGRAPHER · CHENNAI</text>

  ${contactRows}

  <rect x="${panelLeft}" y="${panelTop}" width="${panel}" height="${panel}" fill="${CREAM}"/>
  ${qrSvg}
  <text x="${FULL_W / 2}" y="${captionY}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="500"
        font-size="${captionSize}" letter-spacing="0.04em" fill="${CREAM_DIM}">Scan to view work</text>

  <text x="${FULL_W / 2}" y="${wordmarkY}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="500"
        font-size="${pt(6.5)}" letter-spacing="${wordmarkTracking}em" fill="${CREAM}">MOMENTS BY GANESH PARTHEEBAN</text>
  `;
  }

  // --- Build all art ---------------------------------------------------------
  const photoInners = [];
  for (let i = 0; i < PHOTOS.length; i++) {
    const src = findPhotoSource(PHOTOS[i].n);
    const dataUri = await photoDataUri(src, FULL_W_PX, FULL_H_PX);
    photoInners.push(await photoArt(i, dataUri));
    console.log(`v2: built photo ${i + 1}/6 (gallery-${PHOTOS[i].n}, ${PHOTOS[i].title})`);
  }
  const typeInner = await typeArt();

  const photoSvgsFigma = photoInners.map((inner) => wrapSvg(inner + trimGuide(guideOpts), FULL_W, FULL_H));
  const typeSvgFigma = wrapSvg(typeInner + trimGuide(guideOpts), FULL_W, FULL_H);
  const photoSvgsRender = photoInners.map((inner) => wrapSvg(inner, FULL_W, FULL_H));
  const typeSvgRender = wrapSvg(typeInner, FULL_W, FULL_H);

  for (let i = 0; i < 6; i++) {
    await writeFile(path.join(outDir, `photo-${String(i + 1).padStart(2, "0")}.svg`), photoSvgsFigma[i], "utf8");
  }
  await writeFile(path.join(outDir, "type.svg"), typeSvgFigma, "utf8");
  console.log("v2: wrote photo-01.svg … photo-06.svg, type.svg");

  // --- PDFs --------------------------------------------------------------
  const setPages = [];
  for (let i = 0; i < 6; i++) {
    setPages.push(photoSvgsRender[i], typeSvgRender);
  }
  await renderPdf(setPages, path.join(outDir, "visiting-card-print-set.pdf"), FULL_W, FULL_H);
  console.log("v2: wrote visiting-card-print-set.pdf (12 pages)");

  for (let i = 0; i < 6; i++) {
    const name = `visiting-card-print-${String(i + 1).padStart(2, "0")}.pdf`;
    await renderPdf([photoSvgsRender[i], typeSvgRender], path.join(outDir, name), FULL_W, FULL_H);
    console.log(`v2: wrote ${name}`);
  }

  // --- PNGs (300dpi, trimmed) ----------------------------------------------
  const photoPngPaths = [];
  for (let i = 0; i < 6; i++) {
    const fullBleed = await shootFullBleed(photoSvgsRender[i], `v2-photo-${i}.html`, FULL_W_PX, FULL_H_PX);
    const p = path.join(outDir, `photo-${String(i + 1).padStart(2, "0")}.png`);
    await fullBleedToTrimmedPng(fullBleed, p, FULL_W_PX, FULL_H_PX, TRIM_W_PX, TRIM_H_PX);
    photoPngPaths.push(p);
    console.log(`v2: wrote ${p}`);
  }
  const typeFullBleed = await shootFullBleed(typeSvgRender, "v2-type.html", FULL_W_PX, FULL_H_PX);
  const typePngPath = path.join(outDir, "type.png");
  await fullBleedToTrimmedPng(typeFullBleed, typePngPath, FULL_W_PX, FULL_H_PX, TRIM_W_PX, TRIM_H_PX);
  console.log(`v2: wrote ${typePngPath}`);

  // --- preview.png: contact sheet, 6 photos + type, on neutral ground -----
  const TILE_W = 220;
  const TILE_H = Math.round((TILE_W * TRIM_H) / TRIM_W);
  const GAP = 20;
  const PAD = 40;
  const LABEL_H = 26;
  const tiles = [...photoPngPaths, typePngPath];
  const labels = ["01", "02", "03", "04", "05", "06", "TYPE"];
  const previewW = PAD * 2 + TILE_W * tiles.length + GAP * (tiles.length - 1);
  const previewH = PAD * 2 + LABEL_H + TILE_H;

  const thumbs = await Promise.all(tiles.map((p) => sharp(p).resize(TILE_W, TILE_H).toBuffer()));
  let labelSvg = `<rect width="${previewW}" height="${previewH}" fill="#e7e2d8"/>`;
  const composites = [];
  for (let i = 0; i < tiles.length; i++) {
    const x = PAD + i * (TILE_W + GAP);
    const y = PAD + LABEL_H;
    labelSvg += `<text x="${x}" y="${PAD + 18}" font-family="sans-serif" font-size="13" letter-spacing="2" fill="#7a7266">${labels[i]}</text>`;
    labelSvg += `<rect x="${x - 1}" y="${y - 1}" width="${TILE_W + 2}" height="${TILE_H + 2}" fill="none" stroke="#b9b2a3" stroke-width="1"/>`;
    composites.push({ input: thumbs[i], left: x, top: y });
  }
  const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${previewW}" height="${previewH}">${labelSvg}</svg>`;
  const previewPath = path.join(outDir, "preview.png");
  await sharp(Buffer.from(previewSvg)).composite(composites).png().toFile(previewPath);
  console.log(`v2: wrote ${previewPath}`);

  // --- PRINT-NOTES.md -------------------------------------------------------
  const notes = `# Visiting card (v2, vertical series) — print notes

## Size
- Trim: 55mm × 90mm (portrait, same Indian standard card size as v1, turned
  vertical). Bleed: 3mm on every side → full artboard 61mm × 96mm.
- Safe zone: 3mm inside the trim line → central 49mm × 84mm. Keep all text
  and the QR inside this area; only backgrounds/photos run to the bleed edge.

## The series
- Six photo fronts (photo-01…06, one per case-study cover: Mevlin ⨯ Nikhil,
  Swati ⨯ Sushin, Bhavana ⨯ Jayanth, Theyyam, Agam Concert, Concerts &
  Events) share one typographic back (type). When ordering print, ask the
  printer for "six fronts, one shared back" and split the quantity evenly
  across the six fronts (e.g. 100 of each for a 600-card run) rather than
  printing all six as separate fixed front+back pairs — this is a standard
  short-run variable-data/ganged setup most local offset or digital print
  shops can quote directly from visiting-card-print-set.pdf (all 12 pages,
  in photo/type/photo/type… order) or from the six individual
  visiting-card-print-0N.pdf files if they prefer one file per design.

## Color
- The PDFs/PNGs are generated in RGB (Chrome's print-to-PDF has no CMYK
  output path). Ask the printer to convert to CMYK, or request a CMYK proof
  before a full run.

## Paper & finish
- Suggested stock: 350–400gsm uncoated or textured cotton — tactile,
  on-trend, and consistent with the site's quiet, paper-led voice.
- Uncoated stock will soften photo contrast and saturation slightly
  compared to the on-screen preview; this is normal and part of the
  tactile-minimalism look. If the photos need to stay crisp, a soft-touch
  matte laminate on the photo side only (leaving the type side raw
  uncoated) is a valid alternative — ask the printer for a split-finish job.
- Optional finishes (the artwork itself stays entirely within the website's
  palette — these are physical embellishments on top of it, not colour
  changes): a blind deboss or letterpress impression on the name ("Ganesh
  Partheeban" / "Ganesh" + "Partheeban") and the M mark reads as quiet
  tactile luxury; a copper or bronze foil on the accent hairline rule(s) and
  the monogram's accent dot is a restrained, on-trend way to introduce a
  metallic touch without changing the brand's actual accent colour. Both are
  optional upgrades — the base design works on flat-printed uncoated stock.

## QR code
- Target URL: ${QR_URL}
- Error correction level: M, drawn directly from the \`qrcode\` npm
  package's own module matrix for the URL above.
- Standard dark-on-light polarity this time (ink modules on a cream panel)
  rather than v1's inverted code — this scans more reliably across phone
  cameras and scanner apps. Code area ≥16mm with a 4-module quiet zone
  inside the cream panel.

## Fonts
- Display / name: Fraunces (variable), weight 500 — node_modules/@fontsource-variable/fraunces
- Labels / body: Inter Tight (variable), weights 400–600 — node_modules/@fontsource-variable/inter-tight
- Both are on Google Fonts, so the .svg files reference them by family name
  only (no embedded font files) and will resolve correctly in Figma.

## Type sizes used
- Photo side name ("Ganesh Partheeban"): 15pt Fraunces
- Photo side role label ("Candid Photographer"): 7pt Inter Tight, tracked
- Photo side Index No.: 6.5pt Inter Tight, cream-dim
- Type side name ("Ganesh" / "Partheeban"): sized to fill the safe width,
  picked automatically from 22–26pt based on measured glyph width (see
  console output of the generator for the exact size used on the latest run)
- Type side role label ("Candid Photographer · Chennai"): 7pt, falling back
  to 6.5pt if it doesn't fit — accent colour
- Contact labels/values (type side): 6.5pt Inter Tight, two fixed columns,
  no separator dots, column split sized to the measured width of "INSTAGRAM"
- QR caption ("Scan to view work"): 6.5pt Inter Tight, cream-dim
- Wordmark ("Moments by Ganesh Partheeban"): fixed at 6.5pt per spec, with
  tracking chosen automatically (down from 0.18em) so it fits the 49mm safe
  width — see console output for the exact value used
(6.5pt is the floor used anywhere on the card, per the print minimum.)
`;
  await writeFile(path.join(outDir, "PRINT-NOTES.md"), notes, "utf8");
  console.log(`v2: wrote ${path.join(outDir, "PRINT-NOTES.md")}`);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------
try {
  if (process.argv.includes("--v1")) {
    await runV1(path.join(OUT_DIR, "v1-horizontal"));
  } else {
    await runV2(OUT_DIR);
  }
  console.log("done.");
} finally {
  await browser.close();
  await rm(TMP_DIR, { recursive: true, force: true });
}
