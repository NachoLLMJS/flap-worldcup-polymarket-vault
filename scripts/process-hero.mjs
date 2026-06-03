// Crop the Gemini sparkle watermark (bottom-right) and emit optimized webp
// variants for the hero. One-shot; safe to delete.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'public/hero/hero-trophy.png';
const OUT = 'public/hero';
mkdirSync(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log('source', meta.width, 'x', meta.height);

// Crop off the right and bottom to remove the AI watermark corner.
const cropR = Math.round(meta.width * 0.06);
const cropB = Math.round(meta.height * 0.08);
const w = meta.width - cropR;
const h = meta.height - cropB;

const base = sharp(SRC).extract({ left: 0, top: 0, width: w, height: h });

for (const width of [1920, 1280, 768]) {
  await base
    .clone()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`${OUT}/hero-${width}.webp`);
  console.log('wrote', `hero-${width}.webp`);
}
