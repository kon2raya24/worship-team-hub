// Generate PWA icons (192, 512, maskable 512) from an inline SVG.
// Run: node scripts/generate-icons.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const sharpModule = await import("sharp").catch(() => null);
if (!sharpModule) {
  console.error("sharp not installed. Run: npm install -D sharp");
  process.exit(1);
}
const sharp = sharpModule.default;

// SVG with the same conic-gradient brand mark used in the nav, on the
// app's dark background. 1024x1024 source — sharp downscales to each size.
function brandSvg({ padForMask }) {
  // For maskable icons we shrink the artwork to leave safe-area padding
  // (PWA spec — outer 20% can be clipped to a circle/squircle).
  const inset = padForMask ? 0.18 : 0;
  const size = 1024;
  const innerSize = size * (1 - inset * 2);
  const offset = (size - innerSize) / 2;
  const r = innerSize * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#1a1850" />
        <stop offset="100%" stop-color="#04060e" />
      </radialGradient>
      <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00e8ff" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#ff3aa3" />
      </linearGradient>
      <linearGradient id="inner" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00e8ff" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="6" /></filter>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg)" />
    <g transform="translate(${offset} ${offset})">
      <rect x="0" y="0" width="${innerSize}" height="${innerSize}" rx="${r}" fill="url(#ring)" />
      <rect x="${innerSize * 0.04}" y="${innerSize * 0.04}" width="${innerSize * 0.92}" height="${innerSize * 0.92}" rx="${r * 0.85}" fill="#0a0d1a" />
      <rect x="${innerSize * 0.12}" y="${innerSize * 0.12}" width="${innerSize * 0.76}" height="${innerSize * 0.76}" rx="${r * 0.7}" fill="url(#inner)" filter="url(#blur)" opacity="0.95" />
      <text x="${innerSize / 2}" y="${innerSize * 0.66}" font-family="'Space Grotesk', 'Inter', system-ui, sans-serif"
            font-size="${innerSize * 0.55}" font-weight="700" fill="#ffffff" text-anchor="middle"
            letter-spacing="-0.04em">W</text>
    </g>
  </svg>`;
}

const outDir = path.resolve("public/icons");
if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

const tasks = [
  { svg: brandSvg({ padForMask: false }), size: 192, name: "icon-192.png" },
  { svg: brandSvg({ padForMask: false }), size: 512, name: "icon-512.png" },
  { svg: brandSvg({ padForMask: true }), size: 512, name: "icon-maskable-512.png" },
  // Apple touch icon
  { svg: brandSvg({ padForMask: false }), size: 180, name: "apple-touch-icon.png" },
];

for (const t of tasks) {
  const buf = await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toBuffer();
  await writeFile(path.join(outDir, t.name), buf);
  console.log(`  · ${t.name} (${t.size}×${t.size})`);
}
console.log(`Wrote ${tasks.length} icons → public/icons/`);
