/* Local preview/verification for the og:image trader card.
   Renders api/_card.mjs with satori + resvg in Node (no edge runtime needed)
   and fetches a real X (pbs.twimg.com) photo SERVER-SIDE — no browser CORS —
   to prove the photo embeds. Usage:
     node scripts/og-preview.mjs [photoUrl]
   Default photoUrl resolves to a real pbs.twimg.com avatar. */
import { readFileSync, writeFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogCard } from '../api/_card.mjs';

const here = (p) => new URL(p, import.meta.url);
const font = (f) => readFileSync(here('../public/_fonts/' + f));
const logoDataUrl = 'data:image/png;base64,' + readFileSync(here('../public/brand-logo.png')).toString('base64');

async function toDataUrl(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error('photo fetch ' + res.status + ' ' + url);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || 'image/jpeg';
  return { dataUrl: `data:${ct};base64,${buf.toString('base64')}`, ct, kb: Math.round(buf.length / 1024), finalUrl: res.url };
}

const photoArg = process.argv[2] || 'https://unavatar.io/twitter/jack';
let avatar = '';
let photoInfo = 'none';
try {
  const r = await toDataUrl(photoArg);
  avatar = r.dataUrl;
  photoInfo = `${r.ct} ${r.kb}KB (final: ${r.finalUrl})`;
} catch (e) {
  photoInfo = 'FAILED: ' + e.message;
}
console.log('photo source:', photoArg);
console.log('photo result:', photoInfo);

const el = ogCard({ name: 'Azure', address: '0x3bB8…9fC7', avatar, logo: logoDataUrl, pnl: '+2.480', pct: '+18.6', wr: '67', record: '8-4', vol: '13.2', open: '3', staked: '13.2', portfolio: '4.18', fees: '0.132', spark: '0,0.15,0.05,0.42,0.9,0.7,1.35,1.1,1.95,2.48' });

const svg = await satori(el, {
  width: 1200, height: 630,
  fonts: [
    { name: 'Anton', data: font('Anton-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Archivo', data: font('Archivo-Regular.woff'), weight: 400, style: 'normal' },
    { name: 'Archivo', data: font('Archivo-Bold.woff'), weight: 700, style: 'normal' },
    { name: 'JetBrainsMono', data: font('JetBrainsMono-Regular.woff'), weight: 400, style: 'normal' },
    { name: 'JetBrainsMono', data: font('JetBrainsMono-Bold.woff'), weight: 700, style: 'normal' },
  ],
});

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
writeFileSync(here('../og-preview.png'), png);
console.log('wrote og-preview.png', Math.round(png.length / 1024), 'KB');
