// Trim transparent borders off the cut-out logo and emit square PNG sizes.
import sharp from 'sharp';

const SRC = 'public/hero/logo-cut.png';
const meta = await sharp(SRC).metadata();
// Drop the bottom-right corner (residual AI sparkle) before trimming so the
// crest stays centered.
const cropped = await sharp(SRC)
  .extract({
    left: 0,
    top: 0,
    width: Math.round(meta.width * 0.86),
    height: Math.round(meta.height * 0.93),
  })
  .toBuffer();
const trimmed = sharp(cropped).trim({ threshold: 10 });

for (const s of [512, 256, 96]) {
  await trimmed
    .clone()
    .resize({ width: s, height: s, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`public/hero/logo-${s}.png`);
  console.log('wrote', `logo-${s}.png`);
}
