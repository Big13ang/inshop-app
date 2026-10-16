// Generates the image fixtures used by e2e/posts/compression.spec.ts.
// Run: node e2e/fixtures/images/generate.mjs   (needs `sharp`, which ships with next)
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const outDir = dirname(fileURLToPath(import.meta.url));

// Smooth gradient plus a few hard-edged shapes: realistic enough to compress,
// small enough to commit. Deterministic (no randomness).
function patternSvg(width, height) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e6fd9"/><stop offset="0.5" stop-color="#f2a33a"/><stop offset="1" stop-color="#8e2de2"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="${width * 0.3}" cy="${height * 0.4}" r="${height * 0.2}" fill="#ffffff" fill-opacity="0.8"/>
    <rect x="${width * 0.55}" y="${height * 0.5}" width="${width * 0.25}" height="${height * 0.3}" fill="#101820"/>
  </svg>`);
}

async function jpeg(name, width, height, quality) {
  const buffer = await sharp(patternSvg(width, height)).jpeg({ quality }).toBuffer();
  await writeFile(join(outDir, name), buffer);
}

async function transparentPng(name, width, height) {
  // Left half fully transparent, right half opaque shapes.
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="${width / 2}" width="${width / 2}" height="${height}" fill="#e63946"/>
    <circle cx="${width * 0.25}" cy="${height * 0.5}" r="${height * 0.2}" fill="#2a9d8f" fill-opacity="0.5"/>
  </svg>`);
  await writeFile(join(outDir, name), await sharp(svg).png({ compressionLevel: 9 }).toBuffer());
}

async function flatJpeg(name, size) {
  const buffer = await sharp({
    create: { width: size, height: size, channels: 3, background: '#808080' },
  })
    .jpeg({ quality: 60 })
    .toBuffer();
  await writeFile(join(outDir, name), buffer);
}

await jpeg('photo-4000x3000.jpg', 4000, 3000, 85);
await jpeg('panorama-4000x2000.jpg', 4000, 2000, 85);
await transparentPng('transparent-1600x1200.png', 1600, 1200);
await flatJpeg('tiny-1080x1080.jpg', 1080);
