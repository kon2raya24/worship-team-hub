// Generate PWA manifest screenshots (wide + narrow) styled to look like
// real Worship Hub screens. These are used by app stores + Chrome's
// install dialog. Run: node scripts/generate-screenshots.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const sharpModule = await import("sharp").catch(() => null);
if (!sharpModule) {
  console.error("sharp not installed");
  process.exit(1);
}
const sharp = sharpModule.default;

function commonDefs() {
  return `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0d1f" />
        <stop offset="100%" stop-color="#04060e" />
      </linearGradient>
      <radialGradient id="aurora1" cx="20%" cy="10%" r="40%">
        <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="aurora2" cx="90%" cy="20%" r="40%">
        <stop offset="0%" stop-color="#00e8ff" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#00e8ff" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="aurora3" cx="70%" cy="90%" r="40%">
        <stop offset="0%" stop-color="#ff3aa3" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#ff3aa3" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="heroText" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00e8ff" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#ff3aa3" />
      </linearGradient>
      <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00e8ff" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
    </defs>
  `;
}

function brandMark(x, y, size = 32) {
  return `
    <g transform="translate(${x} ${y})">
      <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#brand)" />
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${size * 0.2}" fill="#0a0d1a" />
      <text x="${size / 2}" y="${size * 0.72}" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="${size * 0.55}" font-weight="700" fill="#fff">W</text>
    </g>
  `;
}

function wideDashboardSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    ${commonDefs()}
    <rect width="1280" height="720" fill="url(#bg)" />
    <rect width="1280" height="720" fill="url(#aurora1)" />
    <rect width="1280" height="720" fill="url(#aurora2)" />
    <rect width="1280" height="720" fill="url(#aurora3)" />

    <!-- Nav -->
    <rect x="0" y="0" width="1280" height="62" fill="#070a17" fill-opacity="0.7" />
    <line x1="0" y1="62" x2="1280" y2="62" stroke="#ffffff" stroke-opacity="0.08" />
    ${brandMark(48, 15, 32)}
    <text x="92" y="38" font-family="'Space Grotesk',sans-serif" font-size="15" font-weight="600" fill="#fff">Worship Hub</text>
    <rect x="220" y="15" width="640" height="32" rx="14" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08" />

    <!-- Hero glass panel -->
    <rect x="40" y="100" width="1200" height="280" rx="22" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.08" />
    <text x="80" y="160" font-family="'JetBrains Mono',monospace" font-size="12" letter-spacing="2.4" fill="#8a92b4">✨ GOOD MORNING · SUNDAY</text>
    <text x="80" y="230" font-family="'Space Grotesk',sans-serif" font-size="48" font-weight="600" fill="#ffffff">Lemmuel,</text>
    <text x="80" y="290" font-family="'Space Grotesk',sans-serif" font-size="44" font-weight="600" fill="url(#heroText)">let everything that has breath</text>
    <text x="80" y="340" font-family="'Space Grotesk',sans-serif" font-size="44" font-weight="600" fill="#ffffff">praise the Lord.</text>

    <!-- Stat cards -->
    ${[
      { x: 40,  label: "SONG LIBRARY", value: "45",  color: "#8b5cf6", icon: "♪" },
      { x: 340, label: "OPEN PRAYERS", value: "3",   color: "#ff3aa3", icon: "♥" },
      { x: 640, label: "YOUR NEXT ROLE", value: "lead vocal", sub: "Sun, May 31", color: "#00e8ff", icon: "🎤" },
      { x: 940, label: "PINNED", value: "2",   color: "#ffb547", icon: "📌" },
    ].map((c, i) => `
      <g transform="translate(${40 + i * 300} 410)">
        <rect width="280" height="120" rx="20" fill="#ffffff" fill-opacity="0.05" stroke="${c.color}" stroke-opacity="0.3" />
        <rect x="20" y="20" width="48" height="48" rx="14" fill="${c.color}" fill-opacity="0.15" stroke="${c.color}" stroke-opacity="0.3" />
        <text x="44" y="52" text-anchor="middle" font-size="20" fill="${c.color}">${c.icon}</text>
        <text x="84" y="42" font-family="'JetBrains Mono',monospace" font-size="10" letter-spacing="1.4" fill="#8a92b4">${c.label}</text>
        <text x="84" y="72" font-family="'Space Grotesk',sans-serif" font-size="22" font-weight="600" fill="#ffffff">${c.value}</text>
        ${c.sub ? `<text x="84" y="92" font-family="'Inter',sans-serif" font-size="11" fill="#8a92b4">${c.sub}</text>` : ""}
      </g>
    `).join("")}

    <!-- Feature row -->
    ${[
      { x: 40,  label: "NEXT SUNDAY", title: "Sunday, May 31, 2026", body: "Theme: Be still", color: "#00e8ff" },
      { x: 660, label: "LATEST DEVOTION", title: "Walking in His Light", body: "Psalm 27:1", color: "#8b5cf6" },
    ].map(c => `
      <g transform="translate(${c.x} 560)">
        <rect width="580" height="130" rx="20" fill="#ffffff" fill-opacity="0.05" stroke="${c.color}" stroke-opacity="0.3" />
        <text x="24" y="40" font-family="'JetBrains Mono',monospace" font-size="10" letter-spacing="1.4" fill="${c.color}">${c.label}</text>
        <text x="24" y="76" font-family="'Space Grotesk',sans-serif" font-size="22" font-weight="600" fill="#ffffff">${c.title}</text>
        <text x="24" y="100" font-family="'Inter',sans-serif" font-size="13" fill="#8a92b4">${c.body}</text>
        <text x="24" y="120" font-family="'Inter',sans-serif" font-size="13" font-weight="500" fill="${c.color}">Open →</text>
      </g>
    `).join("")}
  </svg>`;
}

function narrowSongSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
    ${commonDefs()}
    <rect width="720" height="1280" fill="url(#bg)" />
    <rect width="720" height="1280" fill="url(#aurora1)" />
    <rect width="720" height="1280" fill="url(#aurora2)" />

    <!-- Status bar mock -->
    <rect x="0" y="0" width="720" height="44" fill="#0a0d1a" />

    <!-- Nav -->
    <rect x="0" y="44" width="720" height="64" fill="#070a17" fill-opacity="0.7" />
    ${brandMark(24, 58, 36)}

    <!-- Header -->
    <text x="40" y="180" font-family="'JetBrains Mono',monospace" font-size="12" letter-spacing="1.6" fill="#8a92b4">← SONGS</text>
    <text x="40" y="250" font-family="'Space Grotesk',sans-serif" font-size="48" font-weight="600" fill="#ffffff">Amazing Grace</text>
    <text x="40" y="288" font-family="'Inter',sans-serif" font-size="18" fill="#8a92b4">John Newton (1779)</text>
    <circle cx="295" cy="282" r="4" fill="#00e8ff" />
    <text x="310" y="288" font-family="'Inter',sans-serif" font-size="18" fill="#8a92b4">Key G</text>
    <circle cx="395" cy="282" r="4" fill="#8b5cf6" />
    <text x="410" y="288" font-family="'Inter',sans-serif" font-size="18" fill="#8a92b4">70 BPM</text>

    <!-- Tags -->
    <g font-family="'JetBrains Mono',monospace" font-size="11" letter-spacing="1.4" fill="#c8cee6">
      <rect x="40" y="318" width="60" height="22" rx="4" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08" />
      <text x="70" y="334" text-anchor="middle">HYMN</text>
      <rect x="110" y="318" width="110" height="22" rx="4" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.08" />
      <text x="165" y="334" text-anchor="middle">PUBLIC-DOMAIN</text>
    </g>

    <!-- Chord viewer glass -->
    <rect x="20" y="380" width="680" height="860" rx="20" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.08" />

    <!-- Toolbar -->
    <rect x="20" y="380" width="680" height="60" rx="20" fill="#070a17" fill-opacity="0.85" />
    <text x="50" y="418" font-family="'JetBrains Mono',monospace" font-size="11" fill="#8a92b4">KEY</text>
    <rect x="85" y="402" width="32" height="28" rx="6" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.12" />
    <text x="101" y="421" text-anchor="middle" font-size="14" fill="#fff">−</text>
    <text x="135" y="421" font-family="'JetBrains Mono',monospace" font-size="14" fill="#fff">+2</text>
    <rect x="170" y="402" width="32" height="28" rx="6" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.12" />
    <text x="186" y="421" text-anchor="middle" font-size="14" fill="#fff">+</text>
    <rect x="540" y="402" width="120" height="28" rx="6" fill="#8b5cf6" fill-opacity="0.2" stroke="#8b5cf6" stroke-opacity="0.4" />
    <text x="600" y="421" text-anchor="middle" font-size="12" fill="#fff">▶ Scroll</text>

    <!-- Verse 1 label -->
    <text x="60" y="490" font-family="'Inter',sans-serif" font-size="16" font-style="italic" fill="#8a92b4">Verse 1</text>

    <!-- Chord-over-lyrics demo -->
    <g font-family="'JetBrains Mono',monospace" font-size="22">
      <text x="60" y="540" fill="#00e8ff" font-weight="600">A</text>
      <text x="60" y="568" fill="#ffffff">A</text>
      <text x="78" y="540" fill="#00e8ff" font-weight="600">B</text>
      <text x="78" y="568" fill="#ffffff">mazing</text>
      <text x="200" y="540" fill="#00e8ff" font-weight="600">B7</text>
      <text x="200" y="568" fill="#ffffff">grace</text>
      <text x="298" y="568" fill="#ffffff">, how</text>
      <text x="380" y="540" fill="#00e8ff" font-weight="600">E</text>
      <text x="380" y="568" fill="#ffffff">sweet</text>
      <text x="478" y="568" fill="#ffffff">the</text>
      <text x="540" y="540" fill="#00e8ff" font-weight="600">B</text>
      <text x="540" y="568" fill="#ffffff">sound</text>

      <text x="60" y="640" fill="#ffffff">That</text>
      <text x="138" y="610" fill="#00e8ff" font-weight="600">B</text>
      <text x="138" y="640" fill="#ffffff">saved</text>
      <text x="238" y="640" fill="#ffffff">a</text>
      <text x="278" y="610" fill="#00e8ff" font-weight="600">C#m</text>
      <text x="278" y="640" fill="#ffffff">wretch</text>
      <text x="408" y="640" fill="#ffffff">like</text>
      <text x="490" y="610" fill="#00e8ff" font-weight="600">F#</text>
      <text x="490" y="640" fill="#ffffff">me</text>
    </g>

    <!-- Verse 2 label -->
    <text x="60" y="720" font-family="'Inter',sans-serif" font-size="16" font-style="italic" fill="#8a92b4">Verse 2</text>

    <g font-family="'JetBrains Mono',monospace" font-size="22">
      <text x="60" y="770" fill="#ffffff">'Twas</text>
      <text x="170" y="740" fill="#00e8ff" font-weight="600">B</text>
      <text x="170" y="770" fill="#ffffff">grace</text>
      <text x="270" y="770" fill="#ffffff">that</text>
      <text x="350" y="740" fill="#00e8ff" font-weight="600">E</text>
      <text x="350" y="770" fill="#ffffff">taught</text>
      <text x="460" y="770" fill="#ffffff">my</text>
      <text x="520" y="740" fill="#00e8ff" font-weight="600">B</text>
      <text x="520" y="770" fill="#ffffff">heart</text>

      <text x="60" y="840" fill="#ffffff">And</text>
      <text x="140" y="810" fill="#00e8ff" font-weight="600">B</text>
      <text x="140" y="840" fill="#ffffff">grace</text>
      <text x="240" y="840" fill="#ffffff">my</text>
      <text x="300" y="810" fill="#00e8ff" font-weight="600">F#m</text>
      <text x="300" y="840" fill="#ffffff">fears</text>
    </g>
  </svg>`;
}

const outDir = path.resolve("public/screenshots");
if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

const tasks = [
  { svg: wideDashboardSvg(), name: "wide-dashboard.png", w: 1280, h: 720 },
  { svg: narrowSongSvg(), name: "narrow-songs.png", w: 720, h: 1280 },
];

for (const t of tasks) {
  const buf = await sharp(Buffer.from(t.svg)).png().toBuffer();
  await writeFile(path.join(outDir, t.name), buf);
  console.log(`  · ${t.name} (${t.w}×${t.h})`);
}
console.log("Wrote screenshots → public/screenshots/");
