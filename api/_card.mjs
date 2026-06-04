/* ============================================================
   FlapWorld — og:image trader card (server-side render)
   Plain element tree (no JSX/React) so the same module feeds both
   @vercel/og's ImageResponse (production) and satori (local preview).
   Satori-safe: flexbox only, explicit flexDirection, hex/rgba colors, inline SVG.
   Wide 1200x630 composition for Twitter summary_large_image.
   ============================================================ */

const ACID = '#d7ff36';
const INK = '#09090a';
const PANEL = '#141414';
const BLUE = '#6aa9ff';
const RED = '#ff5470';

// hyperscript helpers
const box = (style, children) => ({ type: 'div', props: { style: { display: 'flex', flexDirection: 'row', ...style }, children } });
const col = (style, children) => box({ flexDirection: 'column', ...style }, children);
const txt = (style, s) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children: String(s) } });
const img = (src, style) => ({ type: 'img', props: { src, style: { ...style } } });

function pnlColor(pnl) {
  const n = parseFloat(String(pnl).replace(/[^0-9.+-]/g, ''));
  if (!isFinite(n) || n === 0) return '#ffffff';
  return n > 0 ? ACID : RED;
}

function avatarNode(avatar, name) {
  const size = 84, radius = 17;
  if (avatar) return img(avatar, { width: size, height: size, borderRadius: radius, objectFit: 'cover' });
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return col(
    { width: size, height: size, borderRadius: radius, backgroundColor: '#1d1d1d', alignItems: 'center', justifyContent: 'center', border: `2px solid ${ACID}` },
    [txt({ fontFamily: 'Anton', fontSize: 40, color: ACID }, letter)]
  );
}

// win-rate progress ring (SVG arc)
function winRing(wr) {
  const pctNum = parseInt(String(wr).replace(/[^0-9]/g, ''), 10) || 0;
  const r = 44;
  const C = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pctNum / 100)) * C;
  return col(
    { width: 100, height: 100, position: 'relative', alignItems: 'center', justifyContent: 'center' },
    [
      { type: 'svg', props: { width: 100, height: 100, viewBox: '0 0 100 100', style: { position: 'absolute', top: 0, left: 0 }, children: [
        { type: 'circle', props: { cx: 50, cy: 50, r, fill: 'none', stroke: 'rgba(255,255,255,0.14)', strokeWidth: 8 } },
        { type: 'circle', props: { cx: 50, cy: 50, r, fill: 'none', stroke: ACID, strokeWidth: 8, strokeLinecap: 'round', strokeDasharray: `${dash} ${C}`, transform: 'rotate(-90 50 50)' } },
      ] } },
      txt({ fontFamily: 'JetBrainsMono', fontSize: 24, color: '#ffffff' }, wr),
    ]
  );
}

// P&L evolution sparkline (SVG): line + soft fill
function sparkline(values, width, height, up) {
  const vals = (Array.isArray(values) && values.length > 1) ? values : [0, 0];
  const n = vals.length;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = (max - min) || 1;
  const pad = 4;
  const h = height - pad * 2;
  const pts = vals.map((v, i) => {
    const x = (i / (n - 1)) * width;
    const y = pad + (h - ((v - min) / range) * h);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const area = `M0,${height} ` + pts.map((p) => 'L' + p[0] + ',' + p[1]).join(' ') + ` L${width},${height} Z`;
  const stroke = up ? ACID : RED;
  const fill = up ? 'rgba(215,255,54,0.13)' : 'rgba(255,84,112,0.13)';
  return { type: 'svg', props: { width, height, viewBox: `0 0 ${width} ${height}`, children: [
    { type: 'path', props: { d: area, fill } },
    { type: 'path', props: { d: line, fill: 'none', stroke, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } },
  ] } };
}

function statRow(label, value, last) {
  return box(
    { justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: last ? 0 : 18 },
    [
      txt({ fontFamily: 'Archivo', fontSize: 16, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' }, label),
      txt({ fontFamily: 'JetBrainsMono', fontSize: 28, color: '#ffffff' }, value),
    ]
  );
}

function secItem(label, value) {
  return col({}, [
    txt({ fontFamily: 'Archivo', fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.4, textTransform: 'uppercase' }, label),
    txt({ fontFamily: 'JetBrainsMono', fontSize: 21, color: 'rgba(255,255,255,0.92)', marginTop: 3 }, value),
  ]);
}

function parseSpark(s) {
  if (Array.isArray(s)) return s.map(Number).filter((n) => isFinite(n));
  if (typeof s === 'string' && s.trim()) return s.split(',').map(Number).filter((n) => isFinite(n));
  return [];
}

/**
 * @param {{name?,address?,avatar?,pnl?,pct?,wr?,record?,vol?,open?,staked?,portfolio?,fees?,spark?}} d
 */
export function ogCard(d = {}) {
  const name = d.name || 'Trader';
  const address = d.address || '';
  const avatar = d.avatar || '';
  const pnl = d.pnl || '0.000';
  const pct = d.pct || '0.0';
  const wr = (d.wr || '0') + '%';
  const record = d.record || '0-0';
  const vol = d.vol || '0.0';
  const open = d.open || '0';
  const staked = d.staked || '0.0';
  const portfolio = d.portfolio || '0.00';
  const fees = d.fees || '0.000';
  const logo = d.logo || '';
  const pcolor = pnlColor(pnl);
  const up = parseFloat(String(pnl).replace(/[^0-9.+-]/g, '')) >= 0;
  const spark = parseSpark(d.spark);

  return col(
    { width: 1200, height: 630, padding: 48, backgroundColor: INK, color: '#ffffff', fontFamily: 'Archivo', position: 'relative' },
    [
      col({ position: 'absolute', top: -120, right: -120, width: 360, height: 360, borderRadius: 360, backgroundColor: 'rgba(215,255,54,0.10)' }, []),
      // brand watermark (subtle, behind everything)
      ...(logo ? [img(logo, { position: 'absolute', top: 60, left: 318, width: 520, height: 520, opacity: 0.06 })] : []),

      // header
      box(
        { justifyContent: 'space-between', alignItems: 'center' },
        [
          box({ alignItems: 'baseline' }, [
            txt({ fontFamily: 'Anton', fontSize: 34, color: ACID }, 'FLAP'),
            txt({ fontFamily: 'Anton', fontSize: 34, color: '#ffffff', marginLeft: 2 }, 'WORLD'),
          ]),
          txt({ fontFamily: 'Archivo', fontSize: 17, color: ACID, letterSpacing: 3 }, 'WORLD CUP 2026'),
        ]
      ),

      // main
      box(
        { flex: 1, marginTop: 22 },
        [
          // left
          col(
            { width: 600 },
            [
              box({ alignItems: 'center' }, [
                avatarNode(avatar, name),
                col({ marginLeft: 22 }, [
                  txt({ fontFamily: 'Anton', fontSize: 36, color: '#ffffff' }, name),
                  txt({ fontFamily: 'JetBrainsMono', fontSize: 20, color: 'rgba(255,255,255,0.4)', marginTop: 4 }, address),
                ]),
              ]),
              col({ marginTop: 24 }, [
                txt({ fontFamily: 'Archivo', fontSize: 16, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, textTransform: 'uppercase' }, 'All-time P&L'),
                txt({ fontFamily: 'JetBrainsMono', fontSize: 88, color: pcolor, lineHeight: 1, marginTop: 6 }, pnl),
                txt({ fontFamily: 'JetBrainsMono', fontSize: 23, color: pcolor, marginTop: 8 }, `${pct}% · BNB`),
              ]),
              col({ marginTop: 18 }, [sparkline(spark, 540, 64, up)]),
            ]
          ),
          // right panel
          col(
            { flex: 1, marginLeft: 38, backgroundColor: PANEL, borderRadius: 26, padding: 32, justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' },
            [
              box({ alignItems: 'center', marginBottom: 24 }, [
                winRing(wr),
                txt({ fontFamily: 'Archivo', fontSize: 18, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginLeft: 20 }, 'Win rate'),
              ]),
              col({ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 20 }, []),
              statRow('Record', record, false),
              statRow('Volume', vol, true),
            ]
          ),
        ]
      ),

      // secondary metrics strip
      col({ marginTop: 16 }, [
        col({ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 14 }, []),
        box({ justifyContent: 'space-between' }, [
          secItem('Staked', `${staked} BNB`),
          secItem('Portfolio', `${portfolio} BNB`),
          secItem('Fees', `${fees} BNB`),
          secItem('Open pos.', open),
        ]),
      ]),

      // footer
      box(
        { justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
        [
          txt({ fontFamily: 'JetBrainsMono', fontSize: 19, color: 'rgba(255,255,255,0.5)' }, 'flapworld.app'),
          box({ alignItems: 'center' }, [
            col({ width: 9, height: 9, borderRadius: 9, backgroundColor: ACID, marginRight: 9 }, []),
            txt({ fontFamily: 'Archivo', fontSize: 15, color: 'rgba(255,255,255,0.5)' }, 'BNB Chain · BSC'),
          ]),
          box({ backgroundColor: 'rgba(59,130,246,0.15)', border: `1px solid rgba(59,130,246,0.55)`, borderRadius: 999, paddingTop: 8, paddingBottom: 8, paddingLeft: 15, paddingRight: 18, alignItems: 'center' }, [
            { type: 'svg', props: { width: 14, height: 14, viewBox: '0 0 24 24', style: { marginRight: 7 }, children: [{ type: 'path', props: { d: 'M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z', fill: BLUE } }] } },
            txt({ fontFamily: 'Archivo', fontSize: 14, color: BLUE, letterSpacing: 1 }, 'CONTENDER'),
          ]),
        ]
      ),
    ]
  );
}
