// @ts-nocheck
/* ============================================================
   FlapWorld — share landing with dynamic OG / Twitter Card meta
   GET /api/share?address=&name=&avatar=&pnl=&pct=&wr=&record=&vol=&open=
   The X/Twitter crawler doesn't run JS — it reads these meta tags.
   og:image points at /api/og with the same params (server-rendered card).
   Humans get redirected into the SPA.
   ============================================================ */
export const config = { runtime: 'edge' };

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default async function handler(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const origin = url.origin;

  const name = sp.get('name') || 'Trader';
  const pnl = sp.get('pnl') || '0.000';
  const wr = sp.get('wr') || '0';

  const ogImage = `${origin}/api/og?${sp.toString()}`;
  const title = `${name} · FlapWorld`;
  const desc = `All-time P&L ${pnl} BNB · Win rate ${wr}% · World Cup 2026 prediction markets on BNB Chain`;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="FlapWorld">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<meta http-equiv="refresh" content="0; url=/">
</head>
<body style="background:#09090a;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<a href="/" style="color:#d7ff36;text-decoration:none">Go to FlapWorld &rarr;</a>
</body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
