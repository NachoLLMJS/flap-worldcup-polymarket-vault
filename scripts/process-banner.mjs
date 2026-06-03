import sharp from 'sharp';

const SRC = 'public/hero/markets-src.png';
const meta = await sharp(SRC).metadata();
const base = sharp(SRC).extract({
  left: 0,
  top: 0,
  width: Math.round(meta.width * 0.94),
  height: Math.round(meta.height * 0.92),
});
for (const w of [1600, 1024]) {
  await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/hero/markets-${w}.webp`);
  console.log('wrote', `markets-${w}.webp`);
}
