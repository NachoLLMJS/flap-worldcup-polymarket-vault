// Compose a 1200x630 Open Graph share image from the hero photo + crest logo
// + wordmark text. One-shot; safe to delete.
import sharp from 'sharp';

const W = 1200;
const H = 630;

// Base: hero photo cropped to OG ratio, darkened on the left for text.
const base = await sharp('public/hero/hero-1920.webp')
  .resize({ width: W, height: H, fit: 'cover', position: 'right' })
  .toBuffer();

const scrim = Buffer.from(
  `<svg width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#161210" stop-opacity="0.95"/>
        <stop offset="0.55" stop-color="#161210" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#161210" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </svg>`,
);

const logo = await sharp('public/hero/logo-512.png').resize({ width: 96 }).toBuffer();

const text = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .wm { font-family: 'Bricolage Grotesque','Segoe UI',sans-serif; font-weight:700; fill:#f3ece2; }
      .h1 { font-family: 'Bricolage Grotesque','Segoe UI',sans-serif; font-weight:700; fill:#f3ece2; }
      .em { font-family: Georgia, serif; font-style: italic; fill:#e8c479; }
      .sub{ font-family:'Segoe UI',sans-serif; fill:#b9a99a; }
    </style>
    <text x="160" y="118" class="wm" font-size="34">PolyFlap</text>
    <text x="80" y="300" class="h1" font-size="84">Own a piece of</text>
    <text x="80" y="392" class="em" font-size="84">football history.</text>
    <text x="82" y="452" class="sub" font-size="28">World Cup 2026 prediction markets on BNB Chain</text>
  </svg>`,
);

await sharp(base)
  .composite([
    { input: scrim, top: 0, left: 0 },
    { input: logo, top: 52, left: 80 },
    { input: text, top: 0, left: 0 },
  ])
  .png()
  .toFile('public/hero/og.png');

console.log('wrote og.png');
