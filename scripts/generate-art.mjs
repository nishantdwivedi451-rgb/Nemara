// Nemara placeholder art generator.
// Produces original, licence-free SVG illustrations ("ink & arch" style) for every
// image slot in the catalogue. Replace any file by pointing the catalogue `src`
// at real photography — nothing in the UI depends on these files.
//
//   node scripts/generate-art.mjs
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public/art");
const C = {
  ink: "#4B1D5C", night: "#21102A", violet: "#6E3C8C", lav: "#B9A4C8", mist: "#E9E0EE",
  paper: "#F7F3EC", warm: "#FCFAF6", champ: "#C8B184", graphite: "#5A5260", aubergine: "#38133F",
  pearl: "#F3ECE2", rose: "#D9C6D6",
};
const METAL = {
  gold: { base: "#C9A253", hi: "#EED9A0", lo: "#8E6E2E" },
  silver: { base: "#B9BDC4", hi: "#F1F2F4", lo: "#7E848C" },
};
const STONE = { violet: C.violet, lilac: C.lav, plum: C.ink, pearl: C.pearl };

// ---------- primitives ----------
const W = 1200, H = 1500;
let uid = 0;
const defs = () => `
<defs>
  <linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${METAL.gold.hi}"/><stop offset=".45" stop-color="${METAL.gold.base}"/><stop offset="1" stop-color="${METAL.gold.lo}"/></linearGradient>
  <linearGradient id="g-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${METAL.silver.hi}"/><stop offset=".5" stop-color="${METAL.silver.base}"/><stop offset="1" stop-color="${METAL.silver.lo}"/></linearGradient>
  <radialGradient id="g-pearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="${C.pearl}"/><stop offset="1" stop-color="#D6CBBE"/></radialGradient>
  <radialGradient id="g-violet" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#B58BD3"/><stop offset=".55" stop-color="${C.violet}"/><stop offset="1" stop-color="#3B1650"/></radialGradient>
  <radialGradient id="g-lilac" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#EDE2F4"/><stop offset=".6" stop-color="${C.lav}"/><stop offset="1" stop-color="#8E77A3"/></radialGradient>
  <radialGradient id="g-plum" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8A5A9E"/><stop offset=".6" stop-color="${C.ink}"/><stop offset="1" stop-color="#2A0F35"/></radialGradient>
  <radialGradient id="g-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#21102A" stop-opacity=".18"/><stop offset="1" stop-color="#21102A" stop-opacity="0"/></radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .13  0 0 0 0 .06  0 0 0 0 .16  0 0 0 .07 0"/></filter>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${C.lav}" stroke-opacity=".35" stroke-width="1"/></pattern>
</defs>`;
const svg = (body, { w = W, h = H, viewBox, bg = C.paper, grain = true } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox ?? `0 0 ${w} ${h}`}" width="${w}" height="${h}">${defs()}` +
  (bg ? `<rect x="-2000" y="-2000" width="6000" height="6000" fill="${bg}"/>` : "") +
  body +
  (grain ? `<rect x="-2000" y="-2000" width="6000" height="6000" filter="url(#grain)"/>` : "") +
  `</svg>`;
const arch = (x, y, w, h, fill, extra = "") =>
  `<path d="M${x} ${y + h}V${y + h * 0.36}C${x} ${y + h * 0.16} ${x + w * 0.34} ${y + h * 0.07} ${x + w / 2} ${y}C${x + w * 0.66} ${y + h * 0.07} ${x + w} ${y + h * 0.16} ${x + w} ${y + h * 0.36}V${y + h}Z" fill="${fill}" ${extra}/>`;
const g = (t, body) => `<g transform="${t}">${body}</g>`;

// style helpers — `mode` is "color" or "sketch"
const M = (metal, mode, sw = 1) => mode === "sketch"
  ? `fill="none" stroke="${C.ink}" stroke-width="${1.4 * sw}" stroke-linejoin="round"`
  : `fill="url(#g-${metal})" stroke="${METAL[metal].lo}" stroke-width="${0.8 * sw}" stroke-linejoin="round"`;
const S = (stone, mode, sw = 1) => mode === "sketch"
  ? `fill="none" stroke="${C.ink}" stroke-width="${1.2 * sw}"`
  : `fill="url(#g-${stone})" stroke="${stone === "pearl" ? "#CFC2B3" : "#2A0F35"}" stroke-opacity=".5" stroke-width="${0.6 * sw}"`;
const line = (metal, mode, w = 1.6) => mode === "sketch"
  ? `fill="none" stroke="${C.ink}" stroke-width="${w * 0.9}" stroke-linecap="round"`
  : `fill="none" stroke="${METAL[metal].base}" stroke-width="${w}" stroke-linecap="round"`;

// quadratic U-curve helpers for necklaces (lowest point at 0,0)
const qPoint = (t, Wd, Ht) => {
  const x = (1 - t) ** 2 * -Wd + t ** 2 * Wd;
  const y = (1 - t) ** 2 * -Ht + 2 * (1 - t) * t * Ht + t ** 2 * -Ht;
  const dx = 2 * (1 - t) * Wd + 2 * t * Wd; // derivative
  const dy = -2 * (1 - t) * (2 * Ht) + 2 * t * (2 * Ht) * 1;
  return { x, y, a: Math.atan2(dy, dx) * 180 / Math.PI };
};
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- jewellery renderers (local coords) ----------
// Earrings hang from (0,0) = piercing point.
const EAR = {
  drop(metal, mode) {
    return `<path d="M0 0C-5 -9 -1 -17 7 -15" ${line(metal, mode, 1.4)}/>
      <path d="M-1.6 0C-6.5 18-8.5 34-2.5 44C2.5 52 10 56.5 16.5 58L16.5 60.4C8 59.5-.5 55.5-4.6 47.6C-11.5 35.5-7.5 17.5 1.6 0Z" ${M(metal, mode)}/>
      <circle cx="18.5" cy="66.5" r="6.8" ${S("pearl", mode)}/>`;
  },
  jhumka(metal, mode) {
    let fr = "";
    for (let i = -20; i <= 20; i += 4) {
      const len = 8 + (Math.abs(i) % 8 === 0 ? 4 : 0);
      fr += `<line x1="${i}" y1="47" x2="${i}" y2="${47 + len}" ${line(metal, mode, .8)}/><circle cx="${i}" cy="${49 + len}" r="1.9" ${S(i % 8 === 0 ? "violet" : "lilac", mode, .6)}/>`;
    }
    let dots = "";
    for (let i = -14; i <= 14; i += 7) dots += `<circle cx="${i}" cy="${34 - Math.abs(i) * .3}" r="1.6" ${mode === "sketch" ? `fill="none" stroke="${C.ink}"` : `fill="${METAL[metal].hi}"`}/>`;
    return `<circle cx="0" cy="4" r="6.5" ${M(metal, mode)}/><circle cx="0" cy="4" r="3.4" ${S("violet", mode)}/>
      <rect x="-1.4" y="10" width="2.8" height="6" ${M(metal, mode)}/>
      <path d="M-22 46C-22 25-12 15 0 15C12 15 22 25 22 46Z" ${mode === "sketch" ? `fill="none" stroke="${C.ink}" stroke-width="1.4"` : `fill="url(#g-lilac)" stroke="${METAL[metal].lo}" stroke-width=".8"`}/>
      <path d="M-16 28C-8 22 8 22 16 28" ${line(metal, mode, 1.4)}/>${dots}
      <ellipse cx="0" cy="46" rx="22.5" ry="3.6" ${M(metal, mode)}/>${fr}`;
  },
  hoop(metal, mode, R = 22) {
    return `<path d="M0 0V3" ${line(metal, mode, 1.4)}/>
      <circle cx="0" cy="${R + 3}" r="${R}" fill="none" stroke="${mode === "sketch" ? C.ink : METAL[metal].lo}" stroke-width="${mode === "sketch" ? 1.4 : 6.5}"/>
      ${mode === "sketch" ? "" : `<circle cx="0" cy="${R + 3}" r="${R}" fill="none" stroke="url(#g-${metal})" stroke-width="5"/>`}
      <circle cx="0" cy="${R + 3}" r="${R}" fill="none" stroke="${mode === "sketch" ? C.ink : METAL[metal].lo}" stroke-width="1.4" stroke-dasharray="1.2 3.2" stroke-linecap="round"/>
      <circle cx="0" cy="${R * 2 + 3}" r="2.6" ${M(metal, mode)}/>`;
  },
};

// Necklaces: lowest point of the curve at (0,0); ends at (±w, -h).
const NECK = {
  fine(metal, mode, w = 78, h = 120) {
    return `<path d="M${-w} ${-h}Q0 ${h} ${w} ${-h}" ${line(metal, mode, 1.8)}/>
      <rect x="-17" y="-1" width="34" height="5" rx="2.5" ${M(metal, mode)}/>`;
  },
  petals(metal, mode, w = 86, h = 92) {
    let out = `<path d="M${-w} ${-h}Q0 ${h} ${w} ${-h}" ${line(metal, mode, 1.4)}/>`;
    const n = 21;
    for (let i = 0; i < n; i++) {
      const t = 0.14 + (i / (n - 1)) * 0.72;
      const p = qPoint(t, w, h);
      const c = 1 - Math.abs(t - 0.5) * 2; // 0 at ends, 1 centre
      const s = 0.55 + c * 0.75;
      out += g(`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.a).toFixed(1)}) scale(${s.toFixed(2)})`,
        `<path d="M0 0C-5 4-6 12 0 18C6 12 5 4 0 0Z" transform="rotate(90)" ${M(metal, mode, .8)}/>
         <circle cx="0" cy="9" r="0" />` +
        (i % 2 === 0 ? `<circle cx="0" cy="0" r="2.6" ${S("violet", mode, .6)}/>` : `<circle cx="0" cy="0" r="1.4" ${mode === "sketch" ? `fill="none" stroke="${C.ink}"` : `fill="${METAL[metal].hi}"`}/>`));
    }
    out += `<path d="M0 6C-6 12-7 22 0 30C7 22 6 12 0 6Z" ${M(metal, mode)}/><circle cx="0" cy="18" r="3.6" ${S("violet", mode)}/>`;
    out += `<path d="M-14 1C-19 8-19 16-14 21C-9 16-9 8-14 1Z" ${M(metal, mode, .8)}/><path d="M14 1C9 8 9 16 14 21C19 16 19 8 14 1Z" ${M(metal, mode, .8)}/>`;
    return out;
  },
  temple(metal, mode, w = 84, h = 118) {
    let out = `<path d="M${-w} ${-h}Q0 ${h} ${w} ${-h}" ${line(metal, mode, 1.3)}/>`;
    const ts = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    ts.forEach((t, i) => {
      const p = qPoint(t, w, h);
      const r = i === 3 ? 11 : 6.5;
      out += `<circle cx="${p.x.toFixed(1)}" cy="${(p.y + r * .6).toFixed(1)}" r="${r}" ${M(metal, mode)}/>
        <circle cx="${p.x.toFixed(1)}" cy="${(p.y + r * .6).toFixed(1)}" r="${r * .62}" fill="none" stroke="${mode === "sketch" ? C.ink : METAL[metal].lo}" stroke-width=".8"/>
        <circle cx="${p.x.toFixed(1)}" cy="${(p.y + r * .6).toFixed(1)}" r="${r * .22}" ${mode === "sketch" ? `fill="none" stroke="${C.ink}"` : `fill="${METAL[metal].hi}"`}/>`;
      if (i < ts.length - 1) {
        const q = qPoint(t + 0.05, w, h);
        out += `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="2.4" ${S("pearl", mode, .6)}/>`;
      }
    });
    out += `<circle cx="0" cy="22" r="4.6" ${S("pearl", mode)}/>`;
    return out;
  },
};

// Bracelets/kada: ring centred at (0,0), radii rx/ry. `full` draws the back half too.
const ringPts = (rx, ry, a0, a1, n) => Array.from({ length: n }, (_, i) => {
  const a = a0 + (a1 - a0) * (i / (n - 1));
  return { x: rx * Math.cos(a), y: ry * Math.sin(a), a };
});
const band = (rx, ry, hgt, a0, a1) => {
  const top = ringPts(rx, ry, a0, a1, 40).map((p) => `${p.x.toFixed(1)} ${(p.y - hgt / 2).toFixed(1)}`);
  const bot = ringPts(rx, ry, a1, a0, 40).map((p) => `${p.x.toFixed(1)} ${(p.y + hgt / 2).toFixed(1)}`);
  return `M${top.join("L")}L${bot.join("L")}Z`;
};
const WRIST = {
  beads(metal, mode, { rx = 64, ry = 16, full = false } = {}) {
    const r = rng(7);
    const draw = (a0, a1, n, dim) => ringPts(rx, ry, a0, a1, n).map((p) => {
      const lilac = r() > 0.55;
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6.2" ${lilac ? S("lilac", mode) : M(metal, mode)} ${dim ? `opacity=".55"` : ""}/>`;
    }).join("");
    return (full ? draw(Math.PI, 2 * Math.PI, 16, true) : "") + draw(0, Math.PI, 17, false);
  },
  cuff(metal, mode, { rx = 64, ry = 16, full = false } = {}) {
    let out = full ? `<path d="${band(rx, ry, 18, Math.PI * 1.08, Math.PI * 1.92)}" ${M(metal, mode)} opacity=".6"/>` : "";
    out += `<path d="${band(rx, ry, 18, 0, Math.PI)}" ${M(metal, mode)}/>`;
    ringPts(rx, ry, 0.08, Math.PI - 0.08, 26).forEach((p, i) => {
      const d = i % 2 ? 1 : -1;
      out += `<path d="M${(p.x - 3).toFixed(1)} ${(p.y - 8 * d).toFixed(1)}L${(p.x + 3).toFixed(1)} ${(p.y + 8 * d).toFixed(1)}" fill="none" stroke="${mode === "sketch" ? C.ink : METAL[metal].lo}" stroke-width=".9" stroke-opacity=".8"/>`;
    });
    return out;
  },
  links(metal, mode, { rx = 64, ry = 16, full = false } = {}) {
    const draw = (a0, a1, n, dim) => ringPts(rx, ry, a0, a1, n).map((p, i) =>
      `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" ${dim ? `opacity=".55"` : ""}><rect x="-6.5" y="-5" width="13" height="10" rx="4" ${M(metal, mode, .8)}/><rect x="-4.2" y="-3" width="8.4" height="6" rx="2.6" ${S(i % 2 ? "plum" : "violet", mode, .6)}/></g>`).join("");
    return (full ? draw(Math.PI, 2 * Math.PI, 11, true) : "") + draw(0, Math.PI, 11, false);
  },
  hammered(metal, mode, { rx = 64, ry = 16, full = false } = {}) {
    const r = rng(11);
    let out = full ? `<path d="${band(rx, ry, 12, Math.PI, 2 * Math.PI)}" ${M(metal, mode)} opacity=".6"/>` : "";
    out += `<path d="${band(rx, ry, 12, 0, Math.PI)}" ${M(metal, mode)}/>`;
    ringPts(rx, ry, 0.1, Math.PI - 0.1, 30).forEach((p) => {
      out += `<ellipse cx="${(p.x + (r() - .5) * 4).toFixed(1)}" cy="${(p.y + (r() - .5) * 6).toFixed(1)}" rx="${(1.5 + r() * 1.6).toFixed(1)}" ry="${(1 + r()).toFixed(1)}" fill="${mode === "sketch" ? "none" : r() > .5 ? METAL[metal].hi : METAL[metal].lo}" ${mode === "sketch" ? `stroke="${C.ink}" stroke-width=".7"` : `opacity=".7"`}/>`;
    });
    return out;
  },
  repousse(metal, mode, { rx = 64, ry = 16, full = false } = {}) {
    let out = full ? `<path d="${band(rx, ry, 22, Math.PI, 2 * Math.PI)}" ${M(metal, mode)} opacity=".6"/>` : "";
    out += `<path d="${band(rx, ry, 22, 0, Math.PI)}" ${M(metal, mode)}/>`;
    ringPts(rx, ry, 0.15, Math.PI - 0.15, 9).forEach((p, i) => {
      const k = mode === "sketch" ? C.ink : METAL.gold.lo;
      out += i % 2
        ? `<path d="M${(p.x - 5).toFixed(1)} ${(p.y + 8).toFixed(1)}V${(p.y - 2).toFixed(1)}Q${p.x.toFixed(1)} ${(p.y - 10).toFixed(1)} ${(p.x + 5).toFixed(1)} ${(p.y - 2).toFixed(1)}V${(p.y + 8).toFixed(1)}" fill="none" stroke="${k}" stroke-width="1"/>`
        : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="none" stroke="${k}" stroke-width="1"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.4" fill="${mode === "sketch" ? "none" : METAL.gold.hi}" stroke="${mode === "sketch" ? C.ink : "none"}"/>`;
    });
    return out;
  },
  inlay(metal, mode, { rx = 64, ry = 16, full = false } = {}) {
    const one = (dy, a0, a1, dim) => {
      const pts = ringPts(rx, ry, a0, a1, 40).map((p) => `${p.x.toFixed(1)} ${(p.y + dy).toFixed(1)}`).join("L");
      return `<g ${dim ? `opacity=".6"` : ""}><path d="${band(rx, ry, 10, a0, a1)}" transform="translate(0 ${dy})" ${M(metal, mode)}/>
        <path d="M${pts}" fill="none" stroke="${mode === "sketch" ? C.ink : C.ink}" stroke-width="${mode === "sketch" ? 1 : 2.6}" ${mode === "sketch" ? `stroke-dasharray="3 3"` : ""}/></g>`;
    };
    return (full ? one(-7, Math.PI, 2 * Math.PI, true) + one(7, Math.PI, 2 * Math.PI, true) : "") + one(-7, 0, Math.PI) + one(7, 0, Math.PI);
  },
};

// ---------- figure drawings (800x1000 space) ----------
const FIG = {
  profile: `
    <path d="M520 230C565 245 592 290 598 340C600 360 598 372 602 384C615 410 638 440 650 466C654 476 646 484 634 488L616 492C620 500 624 508 618 516C612 520 612 526 618 530C622 540 616 552 602 558C606 580 600 604 574 616C540 630 490 618 458 580"/>
    <path d="M560 393C570 401 584 401 592 393"/><path d="M556 372C570 364 588 366 598 373"/>
    <path d="M452 448C432 446 424 470 428 492C432 512 440 524 450 527C462 529 470 516 466 500C464 490 470 482 472 470C474 456 466 446 452 448Z"/><path d="M448 466C440 476 442 494 452 500"/>
    <path d="M520 230C470 205 380 205 330 250C285 290 280 360 300 410"/>
    <path d="M300 300C240 290 210 340 230 385C248 425 300 425 318 395"/><path d="M262 330C250 350 256 372 272 380"/>
    <path d="M590 332C560 292 520 300 470 330C430 355 420 400 432 440"/>
    <path d="M300 410C320 470 350 520 380 560"/>
    <path d="M560 618C556 680 556 740 566 800C572 840 590 870 620 900C680 920 740 940 820 952"/>
    <path d="M380 560C384 640 376 720 350 790C330 840 280 880 180 912"/>
    <path d="M572 905C610 900 646 910 690 928"/>`,
  neck: `
    <path d="M250 -20C268 80 320 150 400 160C480 150 532 80 550 -20"/>
    <path d="M330 140C335 220 330 300 318 370C300 430 220 460 80 480C40 486 10 492 -40 502"/>
    <path d="M470 140C465 220 470 300 482 370C500 430 580 460 720 480C760 486 790 492 840 502"/>
    <path d="M210 520C280 505 340 520 385 548"/><path d="M590 520C520 505 460 520 415 548"/>
    <path d="M385 548C395 556 405 556 415 548"/>
    <path d="M352 250C362 330 380 400 394 470" stroke-opacity=".45"/><path d="M448 250C438 330 420 400 406 470" stroke-opacity=".45"/>
    <path d="M226 -20C216 120 196 260 140 430"/><path d="M574 -20C584 120 604 260 660 430"/>
    <path d="M380 92C392 100 408 100 420 92" stroke-opacity=".6"/>`,
  hand: `
    <path d="M345 560C335 500 330 450 335 400C320 380 290 350 285 320C283 305 298 300 308 312C325 335 345 360 360 370C358 300 360 230 368 190C372 175 390 176 392 192C396 240 395 300 398 350C400 280 405 200 410 165C414 150 432 152 433 168C436 210 432 290 432 350C436 290 444 220 450 195C454 182 470 186 470 200C468 250 462 310 460 360C468 320 480 280 488 262C494 252 507 258 505 272C498 320 482 380 470 420C465 470 458 520 455 560"/>
    <path d="M345 560C340 700 330 850 322 1040"/><path d="M455 560C465 700 475 850 482 1040"/>
    <path d="M372 400C384 412 400 416 414 412" stroke-opacity=".5"/><path d="M412 196C416 204 426 204 430 196" stroke-opacity=".5"/>`,
};
const figure = (name, stroke, sw = 2.4) =>
  `<g fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${FIG[name]}</g>`;

// ---------- product art specs ----------
const SPEC = {
  "margin-note-drops": { kind: "ear", r: "drop", metal: "gold", tone: C.mist },
  "monsoon-hour-jhumka": { kind: "ear", r: "jhumka", metal: "gold", tone: C.lav },
  "second-glance-hoops": { kind: "ear", r: "hoop", metal: "silver", tone: C.rose },
  "chalk-line-necklace-set": { kind: "neck", r: "fine", metal: "gold", tone: C.mist, studs: "plain" },
  "raat-rani-necklace-set": { kind: "neck", r: "petals", metal: "gold", tone: C.lav, studs: "petal" },
  "inheritance-rewritten-set": { kind: "neck", r: "temple", metal: "gold", tone: C.rose, studs: "disc" },
  "recess-bracelet": { kind: "wrist", r: "beads", metal: "gold", tone: C.mist },
  "thread-of-thought-cuff": { kind: "wrist", r: "cuff", metal: "silver", tone: C.lav },
  "lantern-bracelet": { kind: "wrist", r: "links", metal: "gold", tone: C.rose },
  "sunday-kada": { kind: "wrist", r: "hammered", metal: "gold", tone: C.mist },
  "aangan-kada": { kind: "wrist", r: "repousse", metal: "gold", tone: C.lav },
  "ink-and-gold-kada-pair": { kind: "wrist", r: "inlay", metal: "gold", tone: C.rose },
};

const stud = (type, metal, mode) => type === "petal"
  ? `<path d="M0 0C-6 7-7 16 0 24C7 16 6 7 0 0Z" ${M(metal, mode)}/><circle cx="0" cy="12" r="3" ${S("violet", mode)}/>`
  : type === "disc"
    ? `<circle cx="0" cy="10" r="9" ${M(metal, mode)}/><circle cx="0" cy="10" r="5" fill="none" stroke="${mode === "sketch" ? C.ink : METAL[metal].lo}"/><circle cx="0" cy="26" r="4" ${S("pearl", mode)}/>`
    : `<circle cx="0" cy="6" r="6" ${M(metal, mode)}/>`;

// piece drawn in its "product view", centred around (0,0)
function pieceHero(s, mode) {
  if (s.kind === "ear") {
    if (s.r === "hoop") return g("translate(-60 -40)", EAR.hoop(s.metal, mode, 22)) + g("translate(60 -26)", EAR.hoop(s.metal, mode, 14));
    return g("translate(-55 -45)", EAR[s.r](s.metal, mode)) + g("translate(55 -45) scale(-1 1)", EAR[s.r](s.metal, mode));
  }
  if (s.kind === "neck") {
    const n = NECK[s.r](s.metal, mode, 110, 150);
    return g("translate(0 40)", n) + g("translate(-42 120)", stud(s.studs, s.metal, mode)) + g("translate(42 120)", stud(s.studs, s.metal, mode));
  }
  return WRIST[s.r](s.metal, mode, { rx: 110, ry: 46, full: true });
}

function wornScene(s, mode = "color") {
  if (s.kind === "ear") {
    const piece = s.r === "hoop" ? EAR.hoop(s.metal, mode, 22) : EAR[s.r](s.metal, mode);
    return { fig: "profile", piece: g("translate(450 527) scale(1.7)", piece) };
  }
  if (s.kind === "neck") {
    const geo = s.r === "petals" ? [0, 470, 1.0] : [0, 520, 1.0];
    const n = s.r === "petals" ? NECK.petals(s.metal, mode, 86, 92) : s.r === "temple" ? NECK.temple(s.metal, mode, 80, 138) : NECK.fine(s.metal, mode, 80, 142);
    return { fig: "neck", piece: g(`translate(400 ${geo[1]}) scale(1.15)`, n) };
  }
  return { fig: "hand", piece: g("translate(400 610) scale(1.1)", WRIST[s.r](s.metal, mode, { rx: 60, ry: 16 })) };
}

// ---------- writers ----------
const write = (rel, content) => {
  const p = join(OUT, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, content);
};

function productArt(handle, s) {
  const sc = s.kind === "ear" ? 5.2 : s.kind === "neck" ? 3.6 : 3.8;
  const hero = () => arch(230, 170, 740, 1330, s.tone, `opacity=".55"`) +
    `<ellipse cx="600" cy="1230" rx="330" ry="40" fill="url(#g-shadow)"/>` + g(`translate(600 760) scale(${sc})`, pieceHero(s, "color"));
  write(`products/${handle}/hero.svg`, svg(hero()));

  const ws = wornScene(s);
  const worn = arch(160, 120, 880, 1380, s.tone, `opacity=".8"`) + g("translate(0 0) scale(1.5)", figure(ws.fig, C.ink, 1.8) + ws.piece);
  write(`products/${handle}/worn.svg`, svg(worn, { bg: C.warm }));
  write(`products/${handle}/hover.svg`, svg(worn, { bg: C.warm }));

  // detail: zoom into the piece
  const vb = s.kind === "ear" ? "250 420 400 500" : s.kind === "neck" ? "300 640 600 750" : "330 640 540 675";
  write(`products/${handle}/detail.svg`, svg(hero(), { viewBox: vb }));

  // story: design sketch on grid paper
  const sk = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#grid)"/>
    <g stroke="${C.ink}" stroke-opacity=".35" stroke-dasharray="6 8" fill="none"><path d="M600 120V1380"/><path d="M120 760H1080"/><circle cx="600" cy="760" r="420"/></g>
    <g stroke="${C.violet}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M200 1240H1000"/><path d="M200 1225V1255M1000 1225V1255"/><path d="M215 1232L200 1240L215 1248M985 1232L1000 1240L985 1248"/></g>
    <path d="M820 330C900 300 980 360 960 430C940 500 830 500 800 440C780 400 790 350 840 330" fill="none" stroke="${C.violet}" stroke-width="3" stroke-linecap="round"/>
    <path d="M300 360C340 330 380 320 430 330" fill="none" stroke="${C.violet}" stroke-width="2.5" stroke-linecap="round"/><path d="M420 318L432 331L416 340" fill="none" stroke="${C.violet}" stroke-width="2.5" stroke-linecap="round"/>` +
    g(`translate(600 760) scale(${sc})`, pieceHero(s, "sketch"));
  write(`products/${handle}/story.svg`, svg(sk, { bg: C.paper }));

  // try-on overlay: transparent, piece only.
  let ov;
  if (s.kind === "ear") ov = svg(g("translate(100 20) scale(2.2)", s.r === "hoop" ? EAR.hoop(s.metal, "color", 22) : EAR[s.r](s.metal, "color")), { w: 200, h: 200, bg: null, grain: false });
  else if (s.kind === "neck") {
    const n = s.r === "petals" ? NECK.petals(s.metal, "color", 86, 92) : s.r === "temple" ? NECK.temple(s.metal, "color", 80, 138) : NECK.fine(s.metal, "color", 80, 142);
    ov = svg(g("translate(200 290) scale(2)", n), { w: 400, h: 400, bg: null, grain: false });
  } else ov = svg(g("translate(200 100) scale(2.6)", WRIST[s.r](s.metal, "color", { rx: 64, ry: 16, full: true })), { w: 400, h: 200, bg: null, grain: false });
  write(`products/${handle}/overlay.svg`, ov);
}

for (const [h, s] of Object.entries(SPEC)) productArt(h, s);

// ---------- campaign & editorial ----------
const stars = (n, seed, color) => { const r = rng(seed); let o = ""; for (let i = 0; i < n; i++) o += `<circle cx="${(r() * 1200).toFixed(0)}" cy="${(r() * 900).toFixed(0)}" r="${(r() * 2 + .6).toFixed(1)}" fill="${color}" opacity="${(.3 + r() * .6).toFixed(2)}"/>`; return o; };
const mala = (cx, cy, R, n, color, rr = 6) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return `<circle cx="${(cx + R * Math.cos(a)).toFixed(1)}" cy="${(cy + R * Math.sin(a)).toFixed(1)}" r="${rr}" fill="${color}"/>`; }).join("");
const ruled = (color) => Array.from({ length: 36 }, (_, i) => `<path d="M0 ${60 + i * 42}H1200" stroke="${color}" stroke-width="1" opacity=".35"/>`).join("") + `<path d="M150 0V1500" stroke="${C.violet}" stroke-width="1.5" opacity=".45"/>`;

const camp = {
  "after-hours": svg(stars(70, 3, C.champ) + arch(200, 140, 800, 1360, C.violet, `opacity=".55"`) +
    g("scale(1.5)", figure("profile", C.warm, 1.8) + g("translate(450 527) scale(1.3)", EAR.jhumka("gold", "color"))), { bg: C.night }),
  "nine-to-five": svg(ruled(C.lav) + arch(240, 160, 720, 1340, C.warm, `opacity=".9"`) +
    g("scale(1.5)", figure("neck", C.ink, 1.8) + g("translate(400 520)", NECK.fine("gold", "color", 80, 142))), { bg: C.mist }),
  celebration: svg(mala(600, 700, 470, 54, C.champ, 7) + mala(600, 700, 430, 48, "#E3B85C", 4) + arch(230, 150, 740, 1350, C.champ, `opacity=".28"`) +
    g("scale(1.5)", figure("hand", C.warm, 1.8) + g("translate(400 610)", WRIST.repousse("gold", "color"))), { bg: C.aubergine }),
  everyday: svg(arch(200, 120, 800, 1380, C.lav, `opacity=".55"`) + `<circle cx="930" cy="300" r="110" fill="${C.champ}" opacity=".35"/>` +
    g("scale(1.5)", figure("hand", C.ink, 1.8) + g("translate(400 610)", WRIST.beads("gold", "color")) + g("translate(400 660)", WRIST.hammered("gold", "color"))), { bg: C.paper }),
  founder: svg(ruled(C.lav) + arch(220, 140, 760, 1360, C.lav, `opacity=".5"`) +
    g("scale(1.5)", figure("profile", C.ink, 1.8) + `<g fill="none" stroke="${C.ink}" stroke-width="2"><circle cx="575" cy="396" r="22"/><path d="M553 392L470 380"/></g>` + g("translate(450 527) scale(1.2)", EAR.drop("gold", "color"))) +
    `<g transform="translate(860 1180) rotate(-35)"><rect x="-8" y="-150" width="16" height="260" rx="4" fill="${C.ink}"/><path d="M-8 110L0 140L8 110Z" fill="${C.champ}"/></g>`, { bg: C.warm }),
  studio: svg(`<rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#grid)"/>` + arch(160, 200, 880, 1300, C.mist, `opacity=".9"`) +
    g("translate(1180 -60) scale(-1.5 1.5) rotate(-12 400 600)", figure("hand", C.ink, 1.8)) +
    g("translate(600 980) scale(3)", pieceHero(SPEC["raat-rani-necklace-set"], "sketch")) +
    g("translate(600 980) scale(3)", g("translate(0 40)", NECK.petals("gold", "color", 110, 150))), { bg: C.paper }),
  hero: svg(arch(260, 90, 760, 1410, C.lav, `opacity=".45"`) + `<circle cx="300" cy="320" r="90" fill="${C.champ}" opacity=".3"/>` +
    g("scale(1.5)", figure("profile", C.ink, 1.8) + g("translate(450 527) scale(1.3)", EAR.jhumka("gold", "color")) + g("translate(400 0)", "")), { bg: C.warm }),
};
for (const [k, v] of Object.entries(camp)) write(`campaign/${k}.svg`, v);

// ---------- artist placeholders: hands at work, each with their craft object ----------
const artistArt = {
  "meher-bano": { bg: C.mist, tone: C.lav, obj: g("translate(600 470) scale(4)", EAR.jhumka("gold", "color")) },
  "ramesh-soni": { bg: C.paper, tone: C.rose, obj: g("translate(600 450) scale(4)", EAR.hoop("silver", "color", 22)) },
  "lakshmi-narayanan": { bg: C.warm, tone: C.mist, obj: g("translate(600 600) scale(1.4)", WRIST.repousse("gold", "color", { rx: 110, ry: 40, full: true })) },
  "farida-qureshi": { bg: C.paper, tone: C.lav, obj: g("translate(600 600) scale(1.4)", WRIST.hammered("gold", "color", { rx: 110, ry: 40, full: true })) },
};
for (const [slug, a] of Object.entries(artistArt)) {
  write(`artists/${slug}.svg`, svg(arch(180, 140, 840, 1360, a.tone, `opacity=".6"`) +
    g("translate(-70 540) scale(1.2) rotate(14 400 560)", figure("hand", C.ink, 2)) +
    g("translate(1270 540) scale(-1.2 1.2) rotate(14 400 560)", figure("hand", C.ink, 2)) + a.obj, { bg: a.bg }));
}

// ---------- brand mark (used for OG/social exports) ----------
const N_MARK = `<path d="M0 0H3V100H0Z"/><path d="M67 0H70V100H67Z"/><path d="M0 0H14L70 100H56Z"/><circle cx="68.5" cy="-14" r="7"/>`;
write("brand/mark-ink.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -30 100 140">${g("", `<g fill="${C.ink}">${N_MARK}</g>`)}</svg>`);
write("brand/mark-ivory.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -30 100 140"><g fill="${C.warm}">${N_MARK}</g></svg>`);

console.log("art generated →", OUT);
