#!/usr/bin/env node
/**
 * NEMARA sticker system — print-ready artwork generator.
 *
 *   node scripts/stickers/generate.mjs        → print/stickers/*.pdf + preview PNG
 *
 * Every sheet is A4, units are millimetres. Each option PDF carries three
 * separations on consecutive pages, all in identical position:
 *   1. ARTWORK  — CMYK print (foil shown as gold for approval)
 *   2. FOIL     — 100% K = hot-foil gold plate
 *   3. DIE-CUT  — magenta hairline = kiss-cut contour
 * Backgrounds carry 1.5 mm bleed past the cut; type stays ≥1 mm inside it.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "print/stickers");
const SITE = "https://nemara.vercel.app";
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "content/products.json"), "utf8"));
const artists = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, "content/artists.json"), "utf8")).map((a) => [a.slug ?? a.handle, a]));

const C = { paper: "#F7F3EC", ink: "#4B1D5C", night: "#21102A", violet: "#6E3C8C", lavender: "#B9A4C8", mist: "#E9E0EE", champagne: "#C8B184" };
const BLEED = 1.5;
const CUT = "#EC008C";

/* ---------- brand geometry (from components/brand/Logo.tsx) ---------- */
const WORDMARK = ["M0 0h3v100H0zM67 0h3v100h-3zM0 0h14l56 100H56z", "M92 0h14v100H92zM92 0h56v3H92zM92 48.5h44v3H92zM92 97h58v3H92z", "M172 0h3v100h-3zM172 0h14l34 100h-7zM214 100h3l34-100h-3zM248 0h14v100h-14z", "M284 100h3l36-100h-3zM320 0h8l32 100h-14zM297 64h41v3h-41z", "M382 0h14v100h-14zM396 0h24c20 0 26 12 26 26s-8 26-26 26h-24v-3h22c14 0 16-11 16-23s-4-23-16-23h-22zM414 52h12l28 48h-14z", "M476 100h3l36-100h-3zM512 0h8l32 100h-14zM489 64h41v3h-41z"].join("");
// Micro mark: hairlines thickened 3→7 units so they survive foil at 6–9 mm.
const MARK_N = "M0 0h7v100H0zM63 0h7v100h-7zM0 0h16l54 100H54z";
const BEAD = { cx: 68.5, cy: -14, r: 8 };

/** "f" = gold foil, anything else = a print colour. */
const fin = (f) => (f === "f" ? 'class="f"' : `fill="${f}"`);
/** Wordmark of a given width (mm). `weight` adds an outline (font units) so hairlines hold at micro size. */
const wordmark = (x, y, w, f, weight = 0) => {
  const stroke = weight ? (f === "f" ? ` class="f ws" stroke-width="${weight}"` : ` ${fin(f)} stroke="${f}" stroke-width="${weight}"`) : ` ${fin(f)}`;
  return `<path${stroke} transform="translate(${x} ${y}) scale(${w / 552})" d="${WORDMARK}"/>`;
};
/** Monogram centred on (cx, cy), total height h (mm); the N and its bead can take different finishes. */
const mark = (cx, cy, h, fN, fBead = fN) => {
  const s = h / 122; // bbox y −22…100
  return `<g transform="translate(${cx - 38 * s} ${cy - 39 * s}) scale(${s})"><path ${fin(fN)} d="${MARK_N}"/><circle ${fin(fBead)} cx="${BEAD.cx}" cy="${BEAD.cy}" r="${BEAD.r}"/></g>`;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const inr = (n) => "₹" + n.toLocaleString("en-IN");
const rrect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const wrap = (text, max) => {
  const lines = [""];
  for (const w of text.split(" ")) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + " " + w).length > max) lines.push(w); else lines[lines.length - 1] = cur ? cur + " " + w : w;
  }
  return lines;
};
function qrPath(url, x, y, size) {
  const q = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = q.modules.size, m = size / n;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!q.modules.get(r, c)) continue;
      let e = c; while (e + 1 < n && q.modules.get(r, e + 1)) e++;
      d += `M${(x + c * m).toFixed(3)} ${(y + r * m).toFixed(3)}h${((e - c + 1) * m).toFixed(3)}v${m.toFixed(3)}h${(-(e - c + 1) * m).toFixed(3)}z`;
      c = e;
    }
  }
  return { d, n, module: m };
}

/* ---------- the five designs. Each returns { w, h, art, cut } in local mm ---------- */

/** 01 — The Seal. 20 mm round. Ink ground, gold-foil monogram and ring legend. Pouches, boxes, envelopes. */
function seal() {
  const R = 10, c = R, rt = 6.9, circ = 2 * Math.PI * rt;
  const ring = `M${c - rt} ${c}A${rt} ${rt} 0 1 1 ${c + rt} ${c}A${rt} ${rt} 0 1 1 ${c - rt} ${c}`;
  return {
    w: 20, h: 20,
    art: `<circle cx="${c}" cy="${c}" r="${R + BLEED}" fill="${C.ink}"/>
      <circle class="fs" cx="${c}" cy="${c}" r="8.85" fill="none" stroke-width="0.25"/>
      <circle class="fs" cx="${c}" cy="${c}" r="5.55" fill="none" stroke-width="0.2"/>
      <path id="seal-ring" d="${ring}" fill="none"/>
      <text class="f" font-family="ISans" font-weight="600" font-size="1.62" letter-spacing="0.2"><textPath href="#seal-ring" textLength="${(circ * 0.985).toFixed(2)}" lengthAdjust="spacing">WEAR YOUR STORY · NEMARA · HANDMADE ·</textPath></text>
      ${mark(c, c + 0.35, 6.6, "f")}`,
    cut: `<circle cx="${c}" cy="${c}" r="${R}"/>`,
  };
}

/** 02 — The Story Tag. 32 × 20 mm. One per product: name, maker, QR to the piece's story. Box backs, care cards. */
function storyTag(p) {
  const a = artists[p.artist];
  const lines = wrap(p.name, 12);
  const qr = qrPath(`${SITE}/p/${p.handle}`, 18.4, 2.2, 12);
  const nameY = lines.length > 1 ? 7.6 : 9.2;
  return {
    w: 32, h: 20,
    art: `<path d="${rrect(-BLEED, -BLEED, 32 + 2 * BLEED, 20 + 2 * BLEED, 2 + BLEED)}" fill="${C.paper}"/>
      ${wordmark(2.2, 2.4, 12.4, "f", 5)}
      ${lines.map((l, i) => `<text x="2.2" y="${nameY + i * 3.1}" font-family="ISerif" font-size="3" fill="${C.ink}">${esc(l)}</text>`).join("")}
      <path d="M2.2 ${nameY + (lines.length - 1) * 3.1 + 1.7}h4" stroke="${C.champagne}" stroke-width="0.2"/>
      <text x="2.2" y="15.9" font-family="ISans" font-weight="500" font-size="1.5" fill="${C.ink}">Made by ${esc(a.name)}</text>
      <text x="2.2" y="17.8" font-family="ISans" font-size="1.42" fill="${C.violet}">${esc(a.location.split(",")[0])}</text>
      <rect x="17.6" y="1.4" width="13.6" height="13.6" rx="0.8" fill="#fff"/>
      <path d="${qr.d}" fill="${C.night}"/>
      <text x="24.4" y="17.75" text-anchor="middle" font-family="ISerif" font-style="italic" font-size="1.75" fill="${C.ink}">scan its story</text>`,
    cut: `<path d="${rrect(0, 0, 32, 20, 2)}"/>`,
    meta: { qrModules: qr.n, moduleMm: qr.module },
  };
}

/** 03 — The Jewel Flag. 56 × 10 mm barbell tag that wraps a hoop, chain or kada and sticks to itself — no glue touches the metal. */
function jewelFlag(p) {
  const PW = 14, H = 10, T = 28, TH = 3, W = PW * 2 + T, r = 1.5, f = 0.6;
  const y1 = (H - TH) / 2, y2 = y1 + TH, xb = PW + T;
  const cut = `M${r} 0H${PW - r}A${r} ${r} 0 0 1 ${PW} ${r}V${y1 - f}A${f} ${f} 0 0 0 ${PW + f} ${y1}H${xb - f}A${f} ${f} 0 0 0 ${xb} ${y1 - f}V${r}A${r} ${r} 0 0 1 ${xb + r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}H${xb + r}A${r} ${r} 0 0 1 ${xb} ${H - r}V${y2 + f}A${f} ${f} 0 0 0 ${xb - f} ${y2}H${PW + f}A${f} ${f} 0 0 0 ${PW} ${y2 + f}V${H - r}A${r} ${r} 0 0 1 ${PW - r} ${H}H${r}A${r} ${r} 0 0 1 0 ${H - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  const lines = wrap(p.name, 15);
  const nameY = lines.length > 1 ? 2.9 : 3.6;
  const b = BLEED;
  return {
    w: W, h: H,
    art: `<path d="${rrect(-b, -b, PW + b + 1, H + 2 * b, r + b)}" fill="${C.ink}"/>
      <rect x="${PW - 1}" y="${y1 - b}" width="${T + 2}" height="${TH + 2 * b}" fill="${C.ink}"/>
      <path d="${rrect(xb, -b, PW + b, H + 2 * b, 0.01)}" fill="${C.paper}"/>
      <path d="M${xb} ${-b}h${PW - r}a${r + b} ${r + b} 0 0 1 ${r + b} ${r + b}v${H - 2 * r}a${r + b} ${r + b} 0 0 1 ${-(r + b)} ${r + b}h${-(PW - r)}z" fill="${C.paper}"/>
      ${mark(PW / 2, H / 2 + 0.3, 6.4, "f")}
      ${lines.map((l, i) => `<text x="${xb + 1.3}" y="${nameY + i * 2.25}" font-family="ISerif" font-size="2.15" fill="${C.ink}">${esc(l)}</text>`).join("")}
      <text x="${xb + 1.3}" y="7.15" font-family="ISans" font-weight="600" font-size="1.85" fill="${C.ink}">${inr(p.price)}</text>
      <text x="${xb + PW - 1.1}" y="7.1" text-anchor="end" font-family="ISans" font-weight="500" font-size="1.05" fill="${C.violet}">${esc(p.sku.split("-").slice(-2).join("-"))}</text>
      <text x="${xb + 1.3}" y="8.75" font-family="ISans" font-size="1.12" fill="${C.violet}">MRP incl. of all taxes</text>`,
    cut: `<path d="${cut}"/>`,
  };
}

/** 04 — The Arch. 24 × 32 mm die-cut arch on pearl stock. Ink monogram, gold bead and keyline. Gift boxes, hampers, lookbooks. */
function arch() {
  const w = 24, h = 32, R = w / 2, b = BLEED, rb = 1.5, i = 1.4;
  const shape = (o, rr) => `M${-o} ${h + o - rr}V${R}A${R + o} ${R + o} 0 0 1 ${w + o} ${R}V${h + o - rr}A${rr} ${rr} 0 0 1 ${w + o - rr} ${h + o}H${-o + rr}A${rr} ${rr} 0 0 1 ${-o} ${h + o - rr}Z`;
  const inner = `M${i} ${h - i}V${R}A${R - i} ${R - i} 0 0 1 ${w - i} ${R}V${h - i}Z`;
  return {
    w, h,
    art: `<path d="${shape(b, rb + b)}" fill="${C.paper}"/>
      <path class="fs" d="${inner}" fill="none" stroke-width="0.25"/>
      ${mark(w / 2, 12.6, 9.4, C.ink, "f")}
      ${wordmark(w / 2 - 6.6, 19.4, 13.2, C.ink, 8)}
      <text x="${w / 2}" y="25.2" text-anchor="middle" font-family="ISerif" font-style="italic" font-size="2.5" fill="${C.violet}">wear your story</text>
      <text x="${w / 2}" y="28.6" text-anchor="middle" font-family="ISans" font-weight="600" font-size="1.3" letter-spacing="0.32" fill="${C.ink}">HANDMADE IN INDIA</text>`,
    cut: `<path d="${shape(0, rb)}"/>`,
  };
}

/** 05 — The Margin Note. 60 × 12 mm seal strip in Pratima's hand, signed by the artisan who made the piece. Pouch flaps, box seams, thank-you cards. */
function marginNote(a) {
  const w = 60, h = 12, b = BLEED;
  return {
    w, h,
    art: `<path d="${rrect(-b, -b, w + 2 * b, h + 2 * b, 1.2 + b)}" fill="${C.paper}"/>
      <path d="${rrect(-b, -b, 12 + b, h + 2 * b, 0.01)}" fill="${C.ink}"/>
      <path d="M${-b} ${-b}h${b + 1.2}v${h + 2 * b}h${-(b + 1.2)}z" fill="${C.ink}"/>
      ${mark(6, h / 2 + 0.25, 6.6, "f")}
      <path class="fs" d="M12 0V${h}" stroke-width="0.35"/>
      <text x="14.4" y="5.45" font-family="Caveat" font-weight="600" font-size="4.3" fill="${C.violet}">this one has a story.</text>
      <text x="14.4" y="8.3" font-family="ISans" font-weight="500" font-size="1.45" fill="${C.ink}">Designed by Pratima Saxena · Made by ${esc(a.name)}</text>
      <text x="14.4" y="10.15" font-family="ISans" font-size="1.3" letter-spacing="0.06" fill="${C.violet}">${esc(a.location)} · Handmade in India</text>`,
    cut: `<path d="${rrect(0, 0, w, h, 1.2)}"/>`,
  };
}

/* ---------- sheet imposition ---------- */
const A4 = { w: 210, h: 297 }, M = 10, HEAD = 16;
function impose(design, gap = 4) {
  const cols = Math.floor((A4.w - 2 * M + gap) / (design.w + gap));
  const rows = Math.floor((A4.h - M - HEAD - M + gap) / (design.h + gap));
  const gw = cols * design.w + (cols - 1) * gap, gh = rows * design.h + (rows - 1) * gap;
  const x0 = (A4.w - gw) / 2, y0 = HEAD + M + (A4.h - HEAD - 2 * M - gh) / 2;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([x0 + c * (design.w + gap), y0 + r * (design.h + gap)]);
  return { cells, cols, rows, count: cols * rows };
}

const fontDir = (pkg) => path.dirname(require.resolve(`${pkg}/package.json`)) + "/files/";
const FONT_CSS = [
  ["ISans", "@fontsource/instrument-sans", ["400", "500", "600"], "normal"],
  ["ISerif", "@fontsource/instrument-serif", ["400"], "normal"],
  ["ISerif", "@fontsource/instrument-serif", ["400"], "italic"],
  ["Caveat", "@fontsource/caveat", ["500", "600"], "normal"],
].flatMap(([fam, pkg, weights, style]) => weights.flatMap((wt) => ["latin", "latin-ext"].map((sub) => {
  const file = `${fontDir(pkg)}${pkg.split("/")[1]}-${sub}-${wt}-${style}.woff2`;
  return fs.existsSync(file) ? `@font-face{font-family:${fam};font-weight:${wt};font-style:${style};src:url("file://${file}") format("woff2")${sub === "latin-ext" ? ";unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" : ""}}` : "";
}))).join("\n");

const DEFS = `<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAD9A8"/><stop offset=".45" stop-color="#C8A867"/><stop offset=".7" stop-color="#F1E2B6"/><stop offset="1" stop-color="#B08A4C"/></linearGradient></defs>`;
const GOLD_CSS = `.f{fill:url(#gold)}.fs{stroke:url(#gold);fill:none}.f.ws{stroke:url(#gold)}`;
// Scoped per sheet: <style> inside inline SVG is document-global.
const SHEET_CSS = `.m-art ${GOLD_CSS.replace(/\}\./g, "} .m-art .")}.m-art .cutl{display:none}
  .m-foil .print{visibility:hidden}.m-foil .f{fill:#000}.m-foil .fs{stroke:#000;fill:none}.m-foil .f.ws{stroke:#000}.m-foil .cutl{display:none}
  .m-cut .art{display:none}`;

function sheetSvg(design, mode, label, sheet) {
  const { cells } = sheet;
  const tiles = cells.map(([x, y], i) => `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)})">
    <g class="art">${design.art.replaceAll('id="seal-ring"', `id="seal-ring-${i}"`).replaceAll('href="#seal-ring"', `href="#seal-ring-${i}"`)}</g>
    <g class="cutl" fill="none" stroke="${CUT}" stroke-width="0.1">${design.cut}</g></g>`).join("");
  const plate = { art: "ARTWORK · CMYK (gold = foil, for approval)", foil: "FOIL PLATE · 100% K = hot-foil gold", cut: "DIE-CUT · magenta = kiss-cut contour" }[mode];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" class="m-${mode}">${DEFS}
    <g font-family="ISans" fill="#555"><text x="${M}" y="${M + 1.5}" font-size="3" font-weight="600" fill="#000">NEMARA — ${esc(label.title)}</text>
    <text x="${M}" y="${M + 6}" font-size="2.2">${esc(label.spec)} · ${sheet.count} up on A4 · bleed ${BLEED} mm</text>
    <text x="${A4.w - M}" y="${M + 1.5}" font-size="2.6" font-weight="600" text-anchor="end" fill="${mode === "cut" ? CUT : "#000"}">${plate}</text>
    <text x="${A4.w - M}" y="${M + 6}" font-size="2.2" text-anchor="end">${esc(label.variant ?? "")}</text></g>
    <path d="M${M} ${M + 9}H${A4.w - M}" stroke="#bbb" stroke-width="0.15"/>
    ${tiles}</svg>`;
}

/* In foil mode we need print-only shapes hidden but foil kept; mark print elements explicitly. */
function separate(art) {
  // tag every filled shape/text without a foil class as print-only
  return art.replace(/<(path|circle|rect|text)(?![^>]*class="(f|fs)[" ])([^>]*?)(\/?)>/g, (m, tag, _c, rest, sl) => (/\bclass="/.test(rest) ? m : `<${tag} class="print"${rest}${sl}>`));
}

const page = (svg) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${SHEET_CSS}@page{size:210mm 297mm;margin:0}html,body{margin:0}svg{display:block;page-break-after:always}</style></head><body>${svg}</body></html>`;

/* ---------- build ---------- */
const OPTIONS = [
  { id: "01-the-seal", title: "Option 1 · The Seal", spec: "Ø20 mm round", make: () => [{ d: seal(), variant: "One design" }] },
  { id: "02-the-story-tag", title: "Option 2 · The Story Tag", spec: "32 × 20 mm, r2 corners", make: () => products.map((p) => ({ d: storyTag(p), variant: `${p.name} · ${p.sku}` })) },
  { id: "03-the-jewel-flag", title: "Option 3 · The Jewel Flag (wrap tag)", spec: "56 × 10 mm barbell, pads 14 × 10", make: () => products.map((p) => ({ d: jewelFlag(p), variant: `${p.name} · ${p.sku}` })) },
  { id: "04-the-arch", title: "Option 4 · The Arch", spec: "24 × 32 mm die-cut arch", make: () => [{ d: arch(), variant: "One design" }] },
  { id: "05-the-margin-note", title: "Option 5 · The Margin Note", spec: "60 × 12 mm seal strip", make: () => Object.values(artists).map((a) => ({ d: marginNote(a), variant: `Made by ${a.name}` })) },
];

const pw = await import(path.join(execSync("npm root -g").toString().trim(), "playwright/index.mjs"));
const browser = await pw.chromium.launch();
const ctx = await browser.newContext();
fs.mkdirSync(path.join(OUT, ".build"), { recursive: true });

async function pdf(name, html, opts = { format: "A4" }) {
  const file = path.join(OUT, ".build", name + ".html");
  fs.writeFileSync(file, html);
  const pg = await ctx.newPage();
  await pg.goto("file://" + file);
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: path.join(OUT, name + ".pdf"), printBackground: true, preferCSSPageSize: true, ...opts });
  return pg;
}

const summary = [];
for (const opt of OPTIONS) {
  const variants = opt.make();
  const svgs = [];
  let sheet;
  for (const v of variants) {
    const d = { ...v.d, art: separate(v.d.art) };
    sheet = impose(d);
    const label = { title: opt.title, spec: opt.spec, variant: v.variant };
    for (const mode of ["art", "foil", "cut"]) svgs.push(sheetSvg(d, mode, label, sheet));
  }
  const pg = await pdf(opt.id, page(svgs.join("")));
  await pg.close();
  summary.push({ id: opt.id, variants: variants.length, perSheet: sheet.count, pages: svgs.length, meta: variants[0].d.meta });
  console.log(`✓ ${opt.id}.pdf — ${variants.length} design(s), ${sheet.count} up, ${svgs.length} pages`);
}

/* ---------- presentation: lineup + printer brief ---------- */
const sample = products.find((p) => p.handle === "second-glance-hoops");
const big = (d, scale, id) => {
  const pad = 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${d.w + 2 * pad} ${d.h + 2 * pad}" width="${(d.w + 2 * pad) * scale}mm" height="${(d.h + 2 * pad) * scale}mm">${DEFS}<defs><clipPath id="clip-${id}">${d.cut}</clipPath><filter id="sh-${id}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="0.35" stdDeviation="0.45" flood-color="#21102A" flood-opacity=".22"/></filter></defs>
    <g filter="url(#sh-${id})"><g clip-path="url(#clip-${id})">${d.art.replaceAll("seal-ring", "seal-ring-" + id)}</g></g></svg>`;
};
const hoopMock = (() => {
  const d = jewelFlag(sample);
  // folded flag hanging from a hoop: show pad A only, tail looped over the wire
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60mm" height="60mm">${DEFS}
    <defs><clipPath id="padA"><path d="${rrect(0, 0, 14, 10, 1.5)}"/></clipPath><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3E3B5"/><stop offset=".5" stop-color="#B8924F"/><stop offset="1" stop-color="#E9D29C"/></linearGradient></defs>
    <circle cx="26" cy="27" r="17" fill="none" stroke="url(#metal)" stroke-width="2.2"/>
    <g transform="translate(36.5 37.5) rotate(38)">
      <rect x="-1.5" y="-1.6" width="5" height="3.2" rx="1.4" fill="${C.ink}"/>
      <g transform="translate(3 -5)"><g filter="drop-shadow(0 .4px .5px rgba(33,16,42,.3))"><g clip-path="url(#padA)"><rect width="14" height="10" fill="${C.ink}"/>${mark(7, 5.3, 6.4, "f")}</g></g></g>
    </g></svg>`;
})();
const seals = seal(), story = storyTag(products.find((p) => p.handle === "monsoon-hour-jhumka")), flag = jewelFlag(sample), archD = arch(), note = marginNote(artists["meher-bano"]);
const swap = (d) => d;
const fit = (d, bw, bh) => Math.min(bw / (d.w + 6), bh / (d.h + 6));
const tiles = [
  { n: "The Seal", size: "Ø20 mm round", d: seals, k: 2.6, line: "The signature.", use: "Closes every pouch, gift box and envelope. The first thing she touches when the parcel arrives — it should feel like a wax seal, not a label.", finish: ["Ink-purple ground, hot-foil champagne gold", "Matte laminate so the foil reads against it", "One design · 88 per A4"] },
  { n: "The Story Tag", size: "32 × 20 mm", d: story, k: 2.2, line: "The piece, introduced.", use: "Back of the box or the care card. The QR opens that exact piece — its artisan, its story, the live try-on — and every scan lands in Studio as a visit (utm_source=tag), so you can see which pieces get scanned.", finish: ["Ivory textured / felt label stock", "Gold-foil wordmark; QR printed solid, never foiled", "12 designs, one per product · 55 per A4"], vars: products.map(storyTag) },
  { n: "The Jewel Flag", size: "56 × 10 mm wrap tag", d: flag, k: 1.9, line: "The one that goes on the jewellery.", use: "Adhesive on plating or enamel leaves residue and can lift the finish. So the flag never touches the metal: the thin tail loops a hoop, chain or kada and the two pads stick to each other — monogram on the front, name and MRP on the back. Peels off clean in one pull.", finish: ["White synthetic PP / vinyl, 80–100 µ — paper tails tear", "Permanent adhesive (sticks pad-to-pad), matte lam.", "12 designs · 54 per A4"], vars: products.map(jewelFlag), mock: true },
  { n: "The Arch", size: "24 × 32 mm die-cut", d: archD, k: 2.0, line: "The gift.", use: "Gift boxes, festive hampers and Circle-member birthday parcels. The arch is the website's frame made physical — ink monogram, with its bead picked out in gold.", finish: ["Pearl / shimmer ivory label stock", "Gold-foil keyline and bead, soft-touch lam.", "One design · 42 per A4"] },
  { n: "The Margin Note", size: "60 × 12 mm seal strip", d: note, k: 1.9, line: "The signature of the hands.", use: "Runs across the box seam or pouch flap. Pratima's line in handwriting, signed by the artisan who made the piece — the brand promise, sealed shut.", finish: ["Ivory uncoated stock (you can write on it)", "Removable adhesive — opens without tearing the box", "4 artisan versions · 48 per A4"], vars: Object.values(artists).map(marginNote) },
];
const brief = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
  @page{size:297mm 210mm;margin:0}*{box-sizing:border-box}${GOLD_CSS}html,body{margin:0;background:${C.paper};color:${C.ink};font-family:ISans}
  .pg{width:297mm;height:210mm;padding:14mm 16mm;position:relative;page-break-after:always;overflow:hidden}
  .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.2mm solid ${C.champagne};padding-bottom:4mm;margin-bottom:7mm}
  h1{font:400 13mm/1 ISerif;margin:0;letter-spacing:-.2mm}h1 i{color:${C.violet}}h2{font:400 15mm/1 ISerif;margin:0 0 2mm}
  .eyebrow{font:600 2.6mm ISans;letter-spacing:.5mm;text-transform:uppercase;color:${C.violet};margin:0 0 2mm}
  .lineup{display:flex;flex-wrap:wrap;justify-content:space-around;align-items:flex-end;row-gap:6mm;column-gap:6mm;height:142mm;align-content:space-around}
  .lineup figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:1.5mm}
  figcaption{font:400 4.4mm ISerif}figcaption small{display:block;text-align:center;font:500 2.3mm ISans;color:${C.violet};letter-spacing:.2mm}
  .opt{display:grid;grid-template-columns:158mm 1fr;gap:10mm;height:100%}
  .stage{background:#FCFAF6;border:.2mm solid ${C.mist};border-radius:4mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6mm;padding:6mm}
  .side{display:flex;flex-direction:column;padding-top:4mm}
  .side .line{font:italic 400 6mm/1.2 ISerif;color:${C.violet};margin:0 0 5mm}
  .side p{font-size:3.1mm;line-height:1.55;margin:0 0 4mm}.side ul{margin:0 0 5mm;padding:0;list-style:none;font-size:2.8mm;line-height:1.5}
  .side li{padding:1.6mm 0;border-top:.2mm solid ${C.mist}}
  .actual{display:flex;align-items:center;gap:3mm;font-size:2.3mm;color:${C.violet};margin-top:auto}
  .vars{display:flex;flex-wrap:wrap;gap:2mm;justify-content:center;max-width:146mm}
  .steps{display:flex;gap:4mm;font-size:2.4mm;color:${C.violet};align-items:center}
  table{width:100%;border-collapse:collapse;font-size:2.75mm}th,td{text-align:left;padding:2.2mm 2mm;border-bottom:.2mm solid ${C.mist};vertical-align:top}
  th{font:600 2.3mm ISans;letter-spacing:.35mm;text-transform:uppercase;color:${C.violet}}td b{font:400 3.6mm ISerif}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:6mm;font-size:2.8mm;line-height:1.5}
  .cols h4{font:400 4.6mm ISerif;margin:0 0 1.5mm}.cols ul{margin:0;padding-left:4mm}.cols li{margin-bottom:.9mm}
  .sw{display:inline-block;width:3mm;height:3mm;border-radius:50%;vertical-align:-.5mm;margin-right:1mm;border:.15mm solid #0002}
</style></head><body>
<section class="pg">
  <div class="top"><div><p class="eyebrow">Nemara · Sticker &amp; tag system · v1</p><h1>Five ways to <i>sign</i> a piece.</h1></div>
  <svg width="38mm" viewBox="0 0 552 100"><path fill="${C.ink}" d="${WORDMARK}"/></svg></div>
  <div class="lineup">${[0, 1, 3, 2, 4].map((i) => [tiles[i], i]).map(([t, i]) => `<figure>${big(t.d, t.k, "l" + i)}<figcaption>${t.n}<small>${t.size}</small></figcaption></figure>`).join("")}</div>
</section>
${tiles.map((t, i) => `<section class="pg"><div class="opt">
  <div class="stage">${t.mock ? `<div class="steps">${hoopMock}<span>1 · loop the tail round the wire<br>2 · press the pads together<br>3 · monogram front, price back</span></div>` : ""}
    ${big(t.d, fit(t.d, 140, t.vars ? (t.mock ? 40 : 95) : 150), "o" + i)}
    ${t.vars ? `<div class="vars">${t.vars.map((v, j) => big(v, fit(v, t.vars.length > 6 ? 34 : 70, 26), `v${i}-${j}`)).join("")}</div>` : ""}</div>
  <div class="side"><p class="eyebrow">Option ${i + 1} · ${t.size}</p><h2>${t.n}</h2><p class="line">${t.line}</p><p>${t.use}</p>
    <ul>${t.finish.map((f) => `<li>${f}</li>`).join("")}</ul>
    <div class="actual">${big(t.d, 1, "a" + i)}<span>actual size<br>(print at 100%)</span></div></div>
</div></section>`).join("")}
<section class="pg">
  <div class="top"><div><p class="eyebrow">For the printer</p><h1>Print specification</h1></div><p class="eyebrow">Files: 01–05 *.pdf · each sheet = Artwork / Foil / Die-cut pages</p></div>
  <table><tr><th>Option</th><th>Size / shape</th><th>Stock</th><th>Adhesive</th><th>Finish</th><th>Designs × up per A4</th><th>Starter qty</th></tr>
    <tr><td><b>1 · The Seal</b></td><td>Ø20 mm round</td><td>White semi-gloss or uncoated paper label</td><td>Permanent</td><td>Full ink ground (CMYK) + hot-foil gold, matte lam.</td><td>1 × ${summary[0].perSheet}</td><td>20 sheets (≈${summary[0].perSheet * 20})</td></tr>
    <tr><td><b>2 · The Story Tag</b></td><td>32 × 20 mm, r2 mm</td><td>Ivory / cream textured (felt) label</td><td>Permanent</td><td>CMYK + gold-foil wordmark. QR must stay CMYK black, no foil, no lam. gloss</td><td>12 × ${summary[1].perSheet}</td><td>1 sheet per product</td></tr>
    <tr><td><b>3 · The Jewel Flag</b></td><td>56 × 10 mm barbell, 3 mm tail</td><td>White synthetic PP / vinyl, 80–100 µ (tear-proof)</td><td>Permanent — sticks pad-to-pad only</td><td>CMYK + gold foil, matte lam. Kiss-cut, fillets kept</td><td>12 × ${summary[2].perSheet}</td><td>1 sheet per product</td></tr>
    <tr><td><b>4 · The Arch</b></td><td>24 × 32 mm arch</td><td>Pearl / shimmer ivory label</td><td>Permanent</td><td>CMYK ink + gold-foil keyline &amp; bead, soft-touch lam.</td><td>1 × ${summary[3].perSheet}</td><td>10 sheets (≈${summary[3].perSheet * 10})</td></tr>
    <tr><td><b>5 · The Margin Note</b></td><td>60 × 12 mm, r1.2</td><td>Ivory uncoated (writable) label</td><td>Removable / peelable</td><td>CMYK + gold-foil monogram &amp; rule</td><td>4 × ${summary[4].perSheet}</td><td>2 sheets per artisan</td></tr>
  </table>
  <div class="cols">
    <div><h4>Colour &amp; foil</h4><ul>
      <li><span class="sw" style="background:${C.ink}"></span><b>Nemara Ink</b> #4B1D5C ≈ C72 M100 Y24 K32 · Pantone ~2627 C. Ask for a hard proof — purple drifts on press.</li>
      <li><span class="sw" style="background:${C.violet}"></span>Violet #6E3C8C ≈ C62 M86 Y8 K0 · <span class="sw" style="background:${C.paper}"></span>Ivory #F7F3EC ≈ C2 M3 Y7 K0</li>
      <li><span class="sw" style="background:linear-gradient(135deg,#EAD9A8,#B08A4C)"></span><b>Foil:</b> matte/brushed champagne gold (not bright yellow-gold). Page 2 of each sheet is the foil plate, 100% K.</li>
      <li>Fine foil rules are ≥0.2 mm, foil type ≥4.5 pt. If the printer can't hold the Seal's ring text in foil, print it CMYK gold (C20 M28 Y55 K0) instead.</li></ul></div>
    <div><h4>Cutting &amp; checks</h4><ul>
      <li>Page 3 = die-line (magenta hairline). Kiss-cut on sheets; ask for a <b>half-cut backing split</b> so stickers peel fast at packing.</li>
      <li>1.5 mm bleed on every background; text 1 mm inside the cut. Do not rescale.</li>
      <li>Story Tag QRs (${summary[1].meta.qrModules}×${summary[1].meta.qrModules} modules, ${summary[1].meta.moduleMm.toFixed(2)} mm each) — <b>scan-test one from every sheet</b> before the run.</li>
      <li>Jewel Flag: test-wrap on a hoop and a kada from the proof; synthetic stock only — paper tails tear.</li>
      <li>Fonts (OFL) in /fonts if prepress needs to edit; otherwise print the PDFs as supplied.</li></ul></div>
  </div>
</section></body></html>`;
const pg = await pdf("Nemara-Stickers-Presentation", brief, { width: "297mm", height: "210mm" });
try { // cover page as a shareable PNG (poppler)
  execSync(`pdftoppm -r 110 -png -f 1 -l 1 -singlefile "${path.join(OUT, "Nemara-Stickers-Presentation.pdf")}" "${path.join(OUT, "Nemara-Stickers-Preview")}"`);
} catch { console.warn("pdftoppm not found — skipped preview PNG"); }
await pg.close();

// ship the OFL fonts for prepress
fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
for (const [pkg, files] of [["@fontsource/instrument-sans", ["latin-400-normal", "latin-500-normal", "latin-600-normal"]], ["@fontsource/instrument-serif", ["latin-400-normal", "latin-400-italic"]], ["@fontsource/caveat", ["latin-600-normal"]]]) {
  for (const f of files) fs.copyFileSync(`${fontDir(pkg)}${pkg.split("/")[1]}-${f}.woff2`, path.join(OUT, "fonts", `${pkg.split("/")[1]}-${f}.woff2`));
}
await browser.close();
fs.rmSync(path.join(OUT, ".build"), { recursive: true, force: true });
console.log("✓ Nemara-Stickers-Presentation.pdf + preview PNG →", path.relative(ROOT, OUT));
