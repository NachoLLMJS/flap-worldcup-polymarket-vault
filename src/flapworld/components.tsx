// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap — shared UI components
   ============================================================ */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useT } from './i18n';
import { TEAM } from './data';

/* ---------- tiny inline icons (simple shapes only) ---------- */
const Icon = {
  wallet: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2"/><circle cx="16.5" cy="13.5" r="1.4" fill="currentColor"/></svg>,
  search: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  close: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevron: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrow: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bolt: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>,
  menu: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  globe: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" stroke="currentColor" strokeWidth="1.7"/></svg>,
  check: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><path d="m5 12 5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  swap: (p)=> <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" {...p}><path d="M7 8h12l-3-3M17 16H5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* ---------- BNB diamond glyph ---------- */
function BnbMark({ size=14, color='currentColor' }){
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{display:'block'}}>
      <g fill={color}>
        <path d="M12 3l3 3-3 3-3-3 3-3zM6 9l3 3-3 3-3-3 3-3zM18 9l3 3-3 3-3-3 3-3zM12 9l3 3-3 3-3-3 3-3zM12 15l3 3-3 3-3-3 3-3z"/>
      </g>
    </svg>
  );
}

/* ---------- flag chip (real flag image from the team's emoji; emoji fallback) ---------- */
const MANUAL_ISO: Record<string,string> = { England:'gb-eng', Scotland:'gb-sct', Wales:'gb-wls', 'Northern Ireland':'gb-nir' };
function isoFromFlagEmoji(flag: string){
  const ri = Array.from(flag || '').filter((c) => { const cp = c.codePointAt(0) || 0; return cp >= 0x1f1e6 && cp <= 0x1f1ff; });
  if (ri.length !== 2) return null;
  return ri.map((c) => String.fromCharCode((c.codePointAt(0) || 0) - 0x1f1e6 + 97)).join('');
}
function FlagChip({ code, size=26, className='' }){
  const team = TEAM(code);
  const iso = MANUAL_ISO[team.en] || isoFromFlagEmoji(team.flag);
  const src = iso ? `https://flagcdn.com/w80/${iso}.png` : null;
  return (
    <span role="img" aria-label={team.en} title={team.en} className={className}
      style={{ width:size, height:size, borderRadius:'50%', flex:'0 0 auto', display:'grid', placeItems:'center', overflow:'hidden',
        background:'#1e1e23', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.16), 0 1px 2px rgba(0,0,0,0.45)',
        fontSize:size*0.6, lineHeight:1 }}>
      {src
        ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : (team.flag || '🏳️')}
    </span>
  );
}

/* Outcome marker: team flag, draw glyph, or "others" */
function OutcomeMark({ outcome, size=26 }){
  if (outcome.kind === 'team') return <FlagChip code={outcome.teamCode} size={size} />;
  if (outcome.kind === 'draw') return (
    <span style={{ width:size, height:size, borderRadius:'50%', flex:'0 0 auto', display:'grid', placeItems:'center',
      background:'#1e1e23', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.16)', color:'#9a9a94', fontSize:size*0.5 }}>
      <Icon.swap />
    </span>
  );
  return (
    <span style={{ width:size, height:size, borderRadius:'50%', flex:'0 0 auto', display:'grid', placeItems:'center',
      background:'#1e1e23', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.16)', color:'#9a9a94', fontWeight:800, fontSize:size*0.34, letterSpacing:'-0.03em' }}>
      ALL
    </span>
  );
}

/* ---------- logo / wordmark ---------- */
function Logo({ onClick, size=22, wordmark=true }){
  return (
    <button onClick={onClick} className="group flex items-center gap-2.5 select-none" aria-label="Polyflap home">
      <img src="/brand-logo.png" alt="Polyflap" draggable={false}
        className="transition-transform group-hover:rotate-[-6deg]"
        style={{ width:size+16, height:size+16, objectFit:'contain', filter:'drop-shadow(0 2px 10px rgba(215,255,54,0.28))' }}/>
      {wordmark && (
        <span className="font-display leading-none tracking-tight" style={{ fontSize:size }}>
          <span className="text-white">POLY</span><span className="text-acid">FLAP</span>
        </span>
      )}
    </button>
  );
}

/* ---------- button ---------- */
function Btn({ as='button', variant='primary', size='md', className='', children, ...rest }){
  const sizes = { sm:'h-9 px-3.5 text-[13px]', md:'h-11 px-5 text-sm', lg:'h-[52px] px-7 text-[15px]' };
  const variants = {
    primary: 'bg-acid text-ink-950 hover:bg-acid-600 active:translate-y-px shadow-[0_6px_24px_-6px_rgba(215,255,54,0.55)]',
    secondary: 'bg-ink-800 text-white ring-1 ring-white/12 hover:bg-ink-750 hover:ring-white/20',
    ghost: 'text-white/80 hover:text-white hover:bg-white/5',
    outline: 'text-white ring-1 ring-white/20 hover:ring-acid hover:text-acid',
    danger: 'bg-down text-white hover:brightness-110',
  };
  const Comp = as;
  return (
    <Comp className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Comp>
  );
}

/* ---------- language toggle ---------- */
function LangToggle({ compact=false }){
  const { lang, setLang } = useT();
  return (
    <div className="inline-flex items-center rounded-lg bg-white/8 p-0.5 ring-1 ring-white/10 backdrop-blur">
      {[['en','EN'],['zh','中文']].map(([k,label])=>(
        <button key={k} onClick={()=>setLang(k)}
          className={`rounded-[6px] px-2.5 py-1 text-xs font-bold transition-colors ${lang===k?'bg-acid text-ink-950':'text-white/70 hover:text-white'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------- identicon avatar (deterministic from a seed/address) ---------- */
function Identicon({ seed='', size=44, radius=12, className='' }){
  let h=2166136261>>>0; for(let i=0;i<seed.length;i++){ h^=seed.charCodeAt(i); h=Math.imul(h,16777619); }
  let a=h>>>0; const rnd=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const palette=['#d7ff36','#46e08c','#5b9dff','#ffc23a','#ff5849'];
  const fg=palette[Math.floor(rnd()*palette.length)];
  const grid=Array.from({length:5},()=>Array(5).fill(false));
  for(let c=0;c<3;c++) for(let r=0;r<5;r++){ const on=rnd()>0.47; grid[r][c]=on; grid[r][4-c]=on; }
  return (
    <span className={className} role="img" aria-label="wallet avatar" style={{ width:size, height:size, borderRadius:radius, background:'#0b0b0d', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gridTemplateRows:'repeat(5,1fr)', padding:size*0.13, boxSizing:'border-box', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.1)', gap:Math.max(1,size*0.02) }}>
      {Array.from({length:25}).map((_,i)=>(<span key={i} style={{ background: grid[Math.floor(i/5)][i%5]?fg:'transparent', borderRadius:2 }}/>))}
    </span>
  );
}

/* ---------- avatar: X (Twitter) profile photo when present, else identicon ---------- */
function Avatar({ wallet, size=44, radius=12, className='' }){
  const url = wallet && wallet.avatar;
  if (url) {
    return (
      <img src={url} alt={wallet.handle ? '@'+wallet.handle : 'profile'} referrerPolicy="no-referrer" className={className}
        style={{ width:size, height:size, borderRadius:radius, objectFit:'cover', display:'block', flex:'0 0 auto', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.12)' }}
        onError={(e)=>{ e.currentTarget.style.display='none'; }}/>
    );
  }
  return <Identicon seed={(wallet && wallet.address) || ''} size={size} radius={radius} className={className}/>;
}

/* ---------- connect wallet ---------- */
function ConnectButton({ wallet, onConnect, onDisconnect, size='md' }){
  const { t } = useT();
  const [open, setOpen] = useState(false);
  if (!wallet){
    return <Btn variant="primary" size={size} onClick={onConnect}><Icon.wallet/> {t('connect')}</Btn>;
  }
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)}
        className="inline-flex items-center gap-2 rounded-xl bg-ink-800 px-3 h-11 ring-1 ring-white/12 hover:ring-white/25 transition">
        <Avatar wallet={wallet} size={26} radius={8}/>
        <span className="text-left leading-tight">
          <span className="block text-xs font-semibold text-white">{wallet.ens}</span>
          <span className="block font-mono text-[10px] text-acid tnum">{wallet.balance.toFixed(3)} BNB</span>
        </span>
        <Icon.chevron className={`text-white/50 transition-transform ${open?'rotate-180':''}`}/>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
          <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl bg-ink-850 p-2 ring-1 ring-white/12 shadow-2xl">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar wallet={wallet} size={34} radius={9}/>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{wallet.ens}</div>
                  <div className="font-mono text-[11px] text-white/45">{wallet.short}</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-wider text-white/40">{t('connected')} · BSC</div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-xs text-white/50">{t('balance')}</span>
                <span className="font-mono text-base text-acid">{wallet.balance.toFixed(4)} BNB</span>
              </div>
            </div>
            <button onClick={()=>{ onDisconnect(); setOpen(false); }}
              className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-down hover:bg-white/5">
              {t('disconnect')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- status badge ---------- */
function StatusBadge({ status, size='md' }){
  const { t } = useT();
  const map = {
    open:     { label:t('st_open'),     cls:'text-acid bg-acid/12 ring-acid/25', dot:'bg-acid live-dot' },
    soon:     { label:t('st_soon'),     cls:'text-warn bg-warn/12 ring-warn/25', dot:'bg-warn live-dot' },
    closed:   { label:t('st_closed'),   cls:'text-down bg-down/12 ring-down/25', dot:'bg-down' },
    resolved: { label:t('st_resolved'), cls:'text-white bg-white/10 ring-white/20', dot:'bg-white/70' },
    pending:  { label:t('st_pending'),  cls:'text-cool bg-cool/12 ring-cool/25', dot:'bg-cool live-dot' },
  };
  const s = map[status] || map.open;
  const pad = size==='sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ring-1 ${pad} ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`}/>{s.label}
    </span>
  );
}

/* ---------- live countdown ---------- */
function useNow(intervalMs=1000){
  const [now, setNow] = useState(()=>Date.now());
  useEffect(()=>{ const id=setInterval(()=>setNow(Date.now()), intervalMs); return ()=>clearInterval(id); },[intervalMs]);
  return now;
}
function fmtDelta(ms){
  if (ms<=0) return null;
  const s=Math.floor(ms/1000), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), ss=s%60;
  if (d>0) return [['D',d],['H',h]];
  if (h>0) return [['H',h],['M',m]];
  return [['M',m],['S',ss]];
}
function Countdown({ target, status }){
  const { t } = useT();
  const now = useNow(1000);
  if (status==='resolved') return <span className="font-mono text-xs text-white/45">{t('st_resolved')}</span>;
  if (status==='closed')   return <span className="font-mono text-xs font-semibold text-down">{t('live')}</span>;
  if (status==='pending')  return <span className="font-mono text-xs text-cool">{t('st_pending')}</span>;
  const parts = fmtDelta(target-now);
  if (!parts) return <span className="font-mono text-xs text-down">{t('closed_at')}</span>;
  const urgent = status==='soon';
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs tnum ${urgent?'text-warn':'text-white/75'}`}>
      {parts.map(([u,v],i)=>(
        <React.Fragment key={u}>
          {i>0 && <span className="text-white/25">:</span>}
          <span className="tabular-nums">{String(v).padStart(2,'0')}<span className="text-[9px] opacity-50">{u}</span></span>
        </React.Fragment>
      ))}
    </span>
  );
}

/* ---------- category tag ---------- */
function CatTag({ cat }){
  const { t } = useT();
  const map = { matches:t('tab_matches'), groups:t('tab_groups'), tournament:t('tab_tournament') };
  return <span className="rounded-md bg-white/6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/55">{map[cat]}</span>;
}

export {
  Icon, BnbMark, FlagChip, OutcomeMark, Logo, Btn, LangToggle, ConnectButton, Identicon,
  StatusBadge, Countdown, CatTag, useNow, fmtDelta, Avatar,
};
