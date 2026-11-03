// Nemara market illustrations — one landmark per market, drawn as plum line-art inside the
// brand arch on lilac paper. Placeholder art: swap any file for photography from the market run.
//
//   node scripts/generate-market-art.mjs   → public/art/markets/<slug>.svg
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public/art/markets");
const C = { paper: "#F4EDF7", warm: "#FCFAFD", ink: "#4A1A5C", violet: "#6E3C8C", lav: "#B9A0D6", mist: "#E8DDF0", gold: "#D9A452" };
const W = 1200, H = 1500;
const line = (d, w = 6, c = C.ink, extra = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arch = (x, y, w, h) => `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`;
const archAt = (cx, base, w, h) => `M${cx - w / 2} ${base}V${base - h + w / 2}A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${base - h + w / 2}V${base}`;
const dome = (cx, base, r) => `M${cx - r} ${base}C${cx - r} ${base - r * 1.15} ${cx - r * 0.2} ${base - r * 1.5} ${cx} ${base - r * 1.9}C${cx + r * 0.2} ${base - r * 1.5} ${cx + r} ${base - r * 1.15} ${cx + r} ${base}`;
const minaret = (cx, base, h, w = 34) => line(`M${cx - w / 2} ${base}V${base - h}H${cx + w / 2}V${base}`, 5) + line(dome(cx, base - h, w / 2 + 4), 5) +
  [0.35, 0.7].map((t) => line(`M${cx - w / 2 - 8} ${base - h * t}H${cx + w / 2 + 8}`, 5)).join("");

const frame = (body, { sun = [880, 420] } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><clipPath id="a"><path d="${arch(150, 120, 900, 1290)}"/></clipPath>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.warm}"/><stop offset="1" stop-color="${C.mist}"/></linearGradient></defs>

<path d="${arch(150, 120, 900, 1290)}" fill="url(#sky)"/>
<g clip-path="url(#a)"><circle cx="${sun[0]}" cy="${sun[1]}" r="110" fill="${C.gold}" opacity=".35"/>${body}</g>
<path d="${arch(150, 120, 900, 1290)}" fill="none" stroke="${C.ink}" stroke-width="5"/>
<path d="${arch(178, 148, 844, 1234)}" fill="none" stroke="${C.lav}" stroke-width="2.5"/>
</svg>`;

const ground = (y) => `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${C.lav}" opacity=".35"/>` + line(`M150 ${y}H1050`, 5);

const ART = {
  // Hawa Mahal: a stepped pyramid of small jharokha windows
  jaipur: frame(ground(1180) + (() => {
    let s = "";
    const rows = [[9, 1130], [9, 1040], [7, 950], [5, 860], [3, 770], [1, 690]];
    for (const [n, y] of rows) {
      const w = 76;
      const x0 = 600 - (n * w) / 2;
      s += line(`M${x0 - 10} ${y + 22}H${x0 + n * w + 10}`, 5);
      for (let i = 0; i < n; i++) {
        const cx = x0 + w / 2 + i * w;
        s += line(archAt(cx, y + 18, 48, 70), 4.5) + line(dome(cx, y - 52, 22), 4);
        s += `<circle cx="${cx}" cy="${y - 10}" r="5" fill="${C.violet}"/>`;
      }
    }
    return s + line("M600 640V600", 5) + `<circle cx="600" cy="592" r="8" fill="${C.gold}"/>`;
  })()),

  // Old Delhi: three onion domes between two minarets over a long arcade
  delhi: frame(ground(1180) + line("M300 1180V940H900V1180", 6) +
    [380, 480, 600, 720, 820].map((x) => line(archAt(x, 1180, 70, 150), 5)).join("") +
    line(dome(600, 940, 120), 6) + line(dome(430, 940, 70), 5) + line(dome(770, 940, 70), 5) +
    line("M600 712V672", 5) + `<circle cx="600" cy="664" r="8" fill="${C.gold}"/>` +
    minaret(250, 1180, 420) + minaret(950, 1180, 420), { sun: [330, 420] }),

  // Kashmir: mountains, Dal Lake and a shikara with its canopy
  kashmir: frame(
    `<path d="M150 900L360 600L470 720L640 480L820 760L920 650L1050 820V1000H150Z" fill="${C.lav}" opacity=".45"/>` +
    line("M150 900L360 600L470 720L640 480L820 760L920 650L1050 820", 6) +
    line("M590 560L640 480L690 560", 4, C.warm) +
    `<rect x="150" y="1000" width="900" height="420" fill="${C.mist}"/>` + line("M150 1000H1050", 5) +
    [1060, 1110, 1170].map((y, i) => line(`M${260 + i * 40} ${y}h120M${650 - i * 30} ${y + 20}h160`, 3, C.violet, 'opacity=".6"')).join("") +
    line("M380 1140Q600 1210 840 1140", 7) + line("M420 1140V1060H780V1140", 5) + line("M400 1060Q600 1000 800 1060", 5) +
    [460, 540, 620, 700].map((x) => line(`M${x} 1065V1135`, 3.5)).join("") +
    line("M870 1090L940 1240", 5) + line("M300 760Q330 700 360 760M330 700V820", 4, C.violet), { sun: [860, 360] }),

  // Charminar: four minarets around a great central arch
  hyderabad: frame(ground(1180) + line("M340 1180V820H860V1180", 6) + line(archAt(600, 1180, 220, 300), 6) +
    line("M340 820H860M340 780H860", 5) + [430, 520, 680, 770].map((x) => line(archAt(x, 815, 50, 70), 4)).join("") +
    line(dome(600, 780, 70), 5) + minaret(360, 1180, 560, 44) + minaret(840, 1180, 560, 44) +
    [470, 730].map((x) => line(archAt(x, 1180, 60, 160), 4)).join(""), { sun: [600, 360] }),

  // Gateway of India: a triumphal arch with domed turrets, by the sea
  mumbai: frame(`<rect x="0" y="1150" width="${W}" height="400" fill="${C.mist}"/>` +
    line("M330 1150V760H870V1150", 6) + line(archAt(600, 1150, 220, 330), 6) + line("M330 760H870M310 730H890", 5) +
    [380, 820].map((x) => line(archAt(x, 1150, 70, 170), 4.5)).join("") +
    [380, 820].map((x) => line(dome(x, 730, 52), 5)).join("") + line(dome(600, 730, 60), 5) +
    [470, 730].map((x) => line(`M${x} 760V720`, 4)).join("") + line("M150 1150H1050", 5) +
    [1200, 1250, 1300, 1350].map((y, i) => line(`M${180 + i * 30} ${y}q40-18 80 0t80 0t80 0`, 3.5, C.violet, 'opacity=".55"') +
      line(`M${640 - i * 20} ${y + 10}q40-18 80 0t80 0`, 3.5, C.violet, 'opacity=".55"')).join(""), { sun: [880, 400] }),

  // Ahmedabad: kites over the rooftops on a festival evening
  ahmedabad: frame(ground(1220) +
    [[230, 1220, 160, 170], [390, 1220, 150, 230], [540, 1220, 170, 150], [710, 1220, 160, 260], [870, 1220, 160, 190]].map(([x, b, w, h]) =>
      line(`M${x} ${b}V${b - h}H${x + w}V${b}`, 5) + line(`M${x + w / 2 - 18} ${b}V${b - 50}H${x + w / 2 + 18}V${b}`, 4) +
      line(`M${x + 30} ${b - h + 40}h26M${x + w - 56} ${b - h + 40}h26`, 4)).join("") +
    [[420, 560, 1, C.violet], [700, 450, 1.3, C.ink], [860, 700, 0.9, C.gold], [300, 780, 0.8, C.ink]].map(([x, y, s, c]) =>
      `<g transform="translate(${x} ${y}) scale(${s}) rotate(-12)"><path d="M0 -70L52 0L0 70L-52 0Z" fill="${c}" opacity=".85"/>` +
      line("M0 -70V70M-52 0H52", 3, C.warm) + line("M0 70q24 40 -6 80q-30 40 6 90", 3, c) + `</g>`).join("") +
    line("M420 560Q520 760 560 1080", 2, C.ink, 'opacity=".5"'), { sun: [330, 380] }),
};

mkdirSync(OUT, { recursive: true });
for (const [slug, svg] of Object.entries(ART)) writeFileSync(join(OUT, `${slug}.svg`), svg);
console.log("market art →", OUT);
