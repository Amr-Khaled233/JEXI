// Generates the illustrated sample product images in public/samples/ used by the
// seed data. Run with: node scripts/generate-samples.mjs
// Replace them with real photography from the admin dashboard.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public/samples");
const W = 800;
const H = 1000;

const TONES = {
  gold: ["#fbe9b5", "#d9b060", "#9a7127", "#5e4214"],
  silver: ["#ffffff", "#d4d6d9", "#8d9095", "#55585c"],
  rose: ["#fbd9c9", "#d4957c", "#9a5b44", "#5e3222"],
};

const BACKDROPS = {
  dark: { inner: "#33261c", outer: "#0d0906", shadow: "#000000", shadowOpacity: 0.55 },
  cream: { inner: "#fbf5ec", outer: "#e6d6c0", shadow: "#6b4f35", shadowOpacity: 0.25 },
};

function defs(tone, backdrop) {
  const [hi, mid, low, deep] = TONES[tone];
  const b = BACKDROPS[backdrop];
  return `<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="75%">
    <stop offset="0" stop-color="${b.inner}"/><stop offset="1" stop-color="${b.outer}"/>
  </radialGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${hi}"/><stop offset=".45" stop-color="${mid}"/><stop offset=".8" stop-color="${low}"/><stop offset="1" stop-color="${deep}"/>
  </linearGradient>
  <linearGradient id="metal2" x1="1" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${low}"/>
  </linearGradient>
  <radialGradient id="pearl" cx="35%" cy="30%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#efe7dc"/><stop offset="1" stop-color="#b9ab98"/>
  </radialGradient>
  <radialGradient id="gem" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e8eef5"/><stop offset="1" stop-color="#9fb0c2"/>
  </radialGradient>
  <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${b.shadow}" stop-opacity="${b.shadowOpacity}"/><stop offset="1" stop-color="${b.shadow}" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
}

// Chain links along a quadratic curve.
function chain(p0, p1, p2, count, rx, ry, stroke = 5) {
  let out = "";
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + (i % 2 ? 90 : 0);
    const r = i % 2 ? [ry, ry * 0.7] : [rx, ry];
    out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r[0]}" ry="${r[1]}" transform="rotate(${angle.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="url(#metal)" stroke-width="${stroke}"/>`;
  }
  return out;
}

// Links around an ellipse (bracelets).
function ringChain(cx, cy, rx, ry, count, lx, ly, stroke = 6) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = cx + rx * Math.cos(a);
    const y = cy + ry * Math.sin(a);
    const tangent = (Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) * 180) / Math.PI + (i % 2 ? 90 : 0);
    out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${lx}" ry="${ly}" transform="rotate(${tangent.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="url(#metal)" stroke-width="${stroke}"/>`;
  }
  return out;
}

const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#shadow)"/>`;

const SHAPES = {
  pendant: () =>
    shadow(400, 800, 260, 40) +
    chain([150, 180], [400, 820], [650, 180], 46, 9, 6, 3.5) +
    `<circle cx="400" cy="530" r="10" fill="none" stroke="url(#metal)" stroke-width="5"/>
     <path d="M400 545 C 470 610, 470 690, 400 740 C 330 690, 330 610, 400 545 Z" fill="url(#metal)" stroke="url(#metal2)" stroke-width="3"/>
     <circle cx="400" cy="655" r="22" fill="url(#gem)" stroke="url(#metal)" stroke-width="4"/>`,
  chainNecklace: () =>
    shadow(400, 820, 270, 40) +
    chain([140, 170], [400, 900], [660, 170], 36, 20, 13, 7) +
    chain([230, 170], [400, 700], [570, 170], 30, 11, 7, 4),
  handChain: () =>
    shadow(400, 860, 230, 36) +
    ringChain(400, 700, 190, 70, 40, 12, 8, 4.5) +
    chain([400, 630], [400, 470], [400, 330], 18, 9, 6, 3.5) +
    chain([400, 470], [300, 380], [260, 250], 14, 8, 5, 3) +
    chain([400, 470], [500, 380], [540, 250], 14, 8, 5, 3) +
    `<ellipse cx="400" cy="300" rx="42" ry="30" fill="none" stroke="url(#metal)" stroke-width="11"/>
     <circle cx="400" cy="470" r="20" fill="url(#gem)" stroke="url(#metal)" stroke-width="5"/>`,
  moonCharm: () =>
    shadow(400, 820, 170, 30) +
    `<circle cx="400" cy="300" r="26" fill="none" stroke="url(#metal)" stroke-width="9"/>
     <mask id="crescent"><rect width="800" height="1000" fill="#fff"/><circle cx="475" cy="505" r="150" fill="#000"/></mask>
     <rect x="396" y="326" width="8" height="60" fill="url(#metal)"/>
     <circle cx="400" cy="555" r="170" fill="url(#metal)" mask="url(#crescent)"/>
     <circle cx="505" cy="520" r="14" fill="url(#gem)" stroke="url(#metal)" stroke-width="3"/>
     <circle cx="545" cy="590" r="9" fill="url(#gem)" stroke="url(#metal)" stroke-width="3"/>`,
  heartCharm: () =>
    shadow(400, 820, 170, 30) +
    `<circle cx="400" cy="300" r="26" fill="none" stroke="url(#metal)" stroke-width="9"/>
     <rect x="396" y="326" width="8" height="80" fill="url(#metal)"/>
     <path d="M400 740 C 230 620, 240 440, 330 420 C 370 412, 395 440, 400 460 C 405 440, 430 412, 470 420 C 560 440, 570 620, 400 740 Z" fill="url(#metal)" transform="translate(0 -40)"/>
     <text x="400" y="600" text-anchor="middle" font-family="Georgia, serif" font-size="96" fill="${"#00000033"}">J</text>`,
  solitaireRing: () =>
    shadow(400, 790, 230, 36) +
    `<ellipse cx="400" cy="560" rx="185" ry="175" fill="none" stroke="url(#metal)" stroke-width="30"/>
     <path d="M350 395 L 400 330 L 450 395 Z" fill="url(#metal2)"/>
     <circle cx="400" cy="320" r="52" fill="url(#gem)" stroke="url(#metal)" stroke-width="6"/>
     <path d="M372 300 L 400 285 L 428 300" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8"/>`,
  twistedRing: () =>
    shadow(400, 790, 230, 36) +
    `<ellipse cx="400" cy="520" rx="190" ry="180" fill="none" stroke="url(#metal)" stroke-width="18" transform="rotate(-8 400 520)"/>
     <ellipse cx="400" cy="520" rx="190" ry="180" fill="none" stroke="url(#metal2)" stroke-width="18" transform="rotate(8 400 520)"/>`,
  pearlDrops: () =>
    shadow(400, 840, 250, 34) +
    [250, 550]
      .map(
        (x) => `<path d="M${x} 250 c -30 0, -30 60, 0 70" fill="none" stroke="url(#metal)" stroke-width="7"/>
     <circle cx="${x}" cy="340" r="16" fill="url(#metal)"/>
     <rect x="${x - 3}" y="356" width="6" height="114" fill="url(#metal)"/>
     <circle cx="${x}" cy="560" r="92" fill="url(#pearl)"/>`,
      )
      .join(""),
  hoops: () =>
    shadow(400, 800, 260, 34) +
    `<circle cx="275" cy="500" r="135" fill="none" stroke="url(#metal)" stroke-width="22"/>
     <circle cx="540" cy="520" r="115" fill="none" stroke="url(#metal2)" stroke-width="20"/>`,
  tennis: () => {
    let gems = "";
    const n = 30;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = 400 + 250 * Math.cos(a);
      const y = 520 + 150 * Math.sin(a);
      gems += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="17" fill="url(#gem)" stroke="url(#metal)" stroke-width="6"/>`;
    }
    return shadow(400, 780, 300, 40) + gems;
  },
  cuban: () => shadow(400, 780, 300, 40) + ringChain(400, 520, 240, 150, 28, 34, 22, 13),
  giftBox: () =>
    shadow(400, 860, 280, 40) +
    `<rect x="190" y="430" width="420" height="380" rx="6" fill="#1b130e" stroke="url(#metal)" stroke-width="4"/>
     <rect x="170" y="370" width="460" height="90" rx="6" fill="#241911" stroke="url(#metal)" stroke-width="4"/>
     <rect x="380" y="370" width="40" height="440" fill="url(#metal)"/>
     <rect x="170" y="400" width="460" height="28" fill="url(#metal2)" opacity=".85"/>
     <path d="M400 370 C 330 260, 230 300, 300 360 Z" fill="none" stroke="url(#metal)" stroke-width="14"/>
     <path d="M400 370 C 470 260, 570 300, 500 360 Z" fill="none" stroke="url(#metal)" stroke-width="14"/>
     <circle cx="400" cy="366" r="18" fill="url(#metal)"/>
     <text x="400" y="640" text-anchor="middle" font-family="Georgia, serif" font-size="44" letter-spacing="16" fill="url(#metal)">JEXI</text>`,
};

async function render(name, shape, tone, backdrop) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(tone, backdrop)}<g filter="url(#soft)">${SHAPES[shape]()}</g></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`));
}

const JOBS = [
  ["aurelia-gold", "pendant", "gold", "dark"],
  ["aurelia-silver", "pendant", "silver", "cream"],
  ["aurelia-rose", "pendant", "rose", "dark"],
  ["lumiere-gold", "chainNecklace", "gold", "dark"],
  ["lumiere-silver", "chainNecklace", "silver", "dark"],
  ["nile-gold", "handChain", "gold", "dark"],
  ["nile-rose", "handChain", "rose", "cream"],
  ["celeste-silver", "handChain", "silver", "dark"],
  ["crescent-gold", "moonCharm", "gold", "dark"],
  ["crescent-silver", "moonCharm", "silver", "cream"],
  ["heart-rose", "heartCharm", "rose", "dark"],
  ["heart-gold", "heartCharm", "gold", "cream"],
  ["solstice-gold", "solitaireRing", "gold", "dark"],
  ["solstice-silver", "solitaireRing", "silver", "cream"],
  ["twist-rose", "twistedRing", "rose", "dark"],
  ["twist-gold", "twistedRing", "gold", "dark"],
  ["pearl-gold", "pearlDrops", "gold", "dark"],
  ["pearl-silver", "pearlDrops", "silver", "cream"],
  ["hoops-gold", "hoops", "gold", "dark"],
  ["hoops-silver", "hoops", "silver", "dark"],
  ["hoops-rose", "hoops", "rose", "cream"],
  ["tennis-silver", "tennis", "silver", "dark"],
  ["tennis-gold", "tennis", "gold", "cream"],
  ["cuban-gold", "cuban", "gold", "dark"],
  ["cuban-silver", "cuban", "silver", "dark"],
  ["giftbox-gold", "giftBox", "gold", "dark"],
  ["giftbox-rose", "giftBox", "rose", "cream"],
];

await mkdir(OUT, { recursive: true });
await Promise.all(JOBS.map(([name, shape, tone, backdrop]) => render(name, shape, tone, backdrop)));
console.log(`Generated ${JOBS.length} images in ${OUT}`);
