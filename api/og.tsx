// @ts-nocheck
/* ============================================================
   Polyflap — og:image edge function
   GET /api/og?name=&address=&avatar=&pnl=&pct=&wr=&record=&vol=&open=
   Renders the trader card (api/_card.mjs) to a 1200x630 PNG.
   The avatar URL (pbs.twimg.com) is fetched SERVER-SIDE by ImageResponse,
   so there is no browser CORS — the X photo embeds reliably.
   ============================================================ */
import { ImageResponse } from '@vercel/og';
import { ogCard } from './_card.mjs';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const { searchParams } = url;
  // fonts are served as static assets from /public/_fonts; fetch them by absolute URL
  // (new URL(..., import.meta.url) is not valid in a Vite edge bundle)
  const origin = url.origin;
  const loadFont = (file) => fetch(`${origin}/_fonts/${file}`).then((r) => r.arrayBuffer());
  const g = (k, d = '') => {
    const v = searchParams.get(k);
    return v === null || v === '' ? d : v;
  };
  const data = {
    name: g('name', 'Trader'),
    address: g('address', ''),
    avatar: g('avatar', ''),
    pnl: g('pnl', '0.000'),
    pct: g('pct', '0.0'),
    wr: g('wr', '0'),
    record: g('record', '0-0'),
    vol: g('vol', '0.0'),
    open: g('open', '0'),
    staked: g('staked', '0.0'),
    portfolio: g('portfolio', '0.00'),
    fees: g('fees', '0.000'),
    spark: g('spark', ''),
    logo: `${origin}/brand-logo.png`,
  };

  const [anton, archivo, archivoB, jbm, jbmB] = await Promise.all([
    loadFont('Anton-Regular.ttf'),
    loadFont('Archivo-Regular.woff'),
    loadFont('Archivo-Bold.woff'),
    loadFont('JetBrainsMono-Regular.woff'),
    loadFont('JetBrainsMono-Bold.woff'),
  ]);

  return new ImageResponse(ogCard(data), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Anton', data: anton, weight: 400, style: 'normal' },
      { name: 'Archivo', data: archivo, weight: 400, style: 'normal' },
      { name: 'Archivo', data: archivoB, weight: 700, style: 'normal' },
      { name: 'JetBrainsMono', data: jbm, weight: 400, style: 'normal' },
      { name: 'JetBrainsMono', data: jbmB, weight: 700, style: 'normal' },
    ],
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
