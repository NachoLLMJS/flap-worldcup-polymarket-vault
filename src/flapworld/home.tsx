// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap - Home / Landing
   ============================================================ */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useT, marketTitle, teamName } from './i18n';
import { Logo, LangToggle, ConnectButton, Btn, Icon, FlagChip } from './components';
import {
  BETTING_VAULT_ADDRESS,
  FLAP_TOKEN_ADDRESS,
  FLAP_VAULT_BEACON_ADDRESS,
  FLAP_VAULT_FACTORY_ADDRESS,
  FLAP_VAULT_IMPLEMENTATION_ADDRESS,
  VAULT_ADDRESS,
  WORLD_CUP_VIEWER_ADDRESS,
} from '../lib/env';
import { MATCHES, GROUP_MARKETS, TOURNAMENT_MARKET, ALL_MARKETS, TEAM, marketStatus, fmtPct, fmtBNB } from './data';

gsap.registerPlugin(ScrollTrigger);

/* Swap this single link for the real cinematic render later. */
const HERO_VIDEO_SRC = '/uploads/16651367-hd_1920_1080_60fps.mp4';
/* When the real frame1->frame2 pull-back render lands, flip to true to
   scrub video.currentTime by scroll progress (needs a pinned section). */
const HERO_SCROLL_SCRUB = false;

/* ---------- reveal wrapper ----------
   IMPORTANT: content is visible by default. We never gate visibility on a
   JS/animation state that could strand it hidden if animations are throttled.
   A subtle in-view entrance is added by *replaying* a transform-only nudge,
   which can never hide content (worst case: it simply renders in place). */
function Reveal({ children, delay=0, y=26, className='', as='div' }){
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const run = ()=>{ el.animate(
      [{ transform:`translateY(${y}px)` }, { transform:'none' }],
      { duration:680, delay, easing:'cubic-bezier(.2,.7,.2,1)', fill:'none' }
    ); };
    const vh = window.innerHeight || 800;
    if (el.getBoundingClientRect().top < vh*0.95){ run(); return; }
    const io = new IntersectionObserver((ents)=>ents.forEach(e=>{ if(e.isIntersecting){ run(); io.disconnect(); } }), { threshold:0.16, rootMargin:'0px 0px -6% 0px' });
    io.observe(el); return ()=>io.disconnect();
  },[]);
  const Comp = as;
  return <Comp ref={ref} className={className}>{children}</Comp>;
}

/* ---------- top nav (rides over hero, or solid on inner pages) ---------- */
function Nav({ route, setRoute, wallet, onConnect, onDisconnect, overHero=false }){
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(()=>{
    const on = ()=>setScrolled(window.scrollY>24);
    on(); window.addEventListener('scroll', on, {passive:true});
    return ()=>window.removeEventListener('scroll', on);
  },[]);
  const solid = !overHero || scrolled;
  const links = [
    { k:'home', label:t('nav_home'), go:()=>setRoute('home') },
    { k:'markets', label:t('nav_markets'), go:()=>setRoute('markets') },
    { k:'portfolio', label:t('nav_portfolio'), go:()=>setRoute('portfolio') },
    { k:'about', label:t('nav_about'), go:()=>setRoute('about') },
    { k:'x', label:'X/Twitter', href:'https://x.com/PolyFlapWC' },
    { k:'leaderboard', label:'Leaderboard', go:()=>setRoute('leaderboard') },
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid?'bg-ink-950/85 backdrop-blur-xl border-b border-white/8':'bg-transparent'}`}>
      <div className="mx-auto flex h-20 max-w-[1320px] items-center gap-5 px-4 sm:px-6">
        <Logo onClick={()=>setRoute('home')} size={28} />
        <nav className="ml-5 hidden items-center gap-1.5 md:flex">
          {links.map(l=>(
            l.href ? (
              <a key={l.k} href={l.href} target="_blank" rel="noopener noreferrer"
                className="group relative rounded-lg px-4 py-2.5 text-[16px] font-semibold text-white transition-colors hover:text-acid">
                {l.label}
              </a>
            ) : (
              <button key={l.k} onClick={l.go}
                className={`group relative rounded-lg px-4 py-2.5 text-[16px] font-semibold transition-colors ${route===l.k?'text-acid':'text-white hover:text-acid'} ${l.soon?'cursor-default':''}`}>
                {l.label}
                {l.soon && <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/50 align-middle">{t('soon_badge')}</span>}
                {route===l.k && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-acid"/>}
              </button>
            )
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <LangToggle/>
          <ConnectButton wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect}/>
        </div>
        {/* mobile */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ConnectButton wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect}/>
          <button onClick={()=>setMenu(true)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/8 text-white ring-1 ring-white/10"><Icon.menu/></button>
        </div>
      </div>
      {menu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur" onClick={()=>setMenu(false)}/>
          <div className="absolute right-0 top-0 h-full w-[78%] max-w-xs bg-ink-900 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <Logo onClick={()=>{ setRoute('home'); setMenu(false); }} size={20}/>
              <button onClick={()=>setMenu(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-white text-lg"><Icon.close/></button>
            </div>
            <div className="mt-7 flex flex-col gap-1">
              {links.map(l=>(
                l.href ? (
                  <a key={l.k} href={l.href} target="_blank" rel="noopener noreferrer" onClick={()=>setMenu(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3.5 text-left text-lg font-bold uppercase tracking-tight text-white/85">
                    {l.label}
                  </a>
                ) : (
                  <button key={l.k} onClick={()=>{ l.go && l.go(); setMenu(false); }}
                    className={`flex items-center justify-between rounded-xl px-3 py-3.5 text-left text-lg font-bold uppercase tracking-tight ${route===l.k?'bg-acid/12 text-acid':'text-white/85'}`}>
                    {l.label}{l.soon && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{t('soon_badge')}</span>}
                  </button>
                )
              ))}
            </div>
            <div className="mt-7"><LangToggle/></div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- live odds ticker ---------- */
function Ticker(){
  const { lang } = useT();
  const items = useMemo(()=>{
    const picks = [...MATCHES.filter(m=>m.baseKind==='open').slice(0,7), GROUP_MARKETS[0], TOURNAMENT_MARKET];
    return picks.map(m=>{
      const fav = m.outcomes.slice().sort((a,b)=>b.prob-a.prob)[0];
      return { id:m.id, code:fav.teamCode, label: fav.teamCode? teamName(fav.teamCode,lang) : (fav.kind==='draw'?'Draw':'Field'), prob:fav.prob, title:marketTitle(m,lang) };
    });
  },[lang]);
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/8 bg-ink-900/70">
      <div className="flex w-max items-center gap-8 py-3 pr-8" style={{ animation:'tickerScroll 38s linear infinite' }}>
        {row.map((it,i)=>(
          <div key={i} className="flex items-center gap-2.5 whitespace-nowrap">
            {it.code ? <FlagChip code={it.code} size={20}/> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] text-white/60">↔</span>}
            <span className="text-sm font-semibold text-white/80">{it.label}</span>
            <span className="font-mono text-sm text-acid tnum">{fmtPct(it.prob)}</span>
            <span className="h-3 w-px bg-white/12"/>
          </div>
        ))}
      </div>
      <style>{`@keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ---------- hero ---------- */
function Hero({ setRoute }){
  const { t } = useT();
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(()=>{
    const ctx = gsap.context(()=>{
      // cinematic scroll feel for the placeholder: slow zoom-out + parallax
      gsap.fromTo(videoRef.current, { scale:1.22 }, {
        scale:1.06, ease:'none',
        scrollTrigger:{ trigger:sectionRef.current, start:'top top', end:'bottom top', scrub:true }
      });
      gsap.to(contentRef.current, {
        yPercent:-16, ease:'none',
        scrollTrigger:{ trigger:sectionRef.current, start:'top top', end:'bottom top', scrub:0.4 }
      });
      gsap.to(hintRef.current, {
        opacity:0, y:14, ease:'none',
        scrollTrigger:{ trigger:sectionRef.current, start:'top top', end:'18% top', scrub:true }
      });
      // --- real render: scrub playback by scroll (needs pin) ---
      if (HERO_SCROLL_SCRUB){
        const v = videoRef.current;
        ScrollTrigger.create({ trigger:sectionRef.current, start:'top top', end:'+=140%', pin:true, scrub:0.6,
          onUpdate:(self)=>{ if (v.duration) v.currentTime = v.duration * self.progress; } });
      }
    }, sectionRef);
    return ()=>ctx.revert();
  },[]);

  return (
    <section ref={sectionRef} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* full-bleed footage at 100% opacity, no dark overlay box */}
      <video ref={videoRef} src={HERO_VIDEO_SRC} autoPlay={!HERO_SCROLL_SCRUB} loop={!HERO_SCROLL_SCRUB} muted playsInline preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ willChange:'transform' }} />
      {/* fallback energy behind the footage (shows if the clip doesn't decode / while it loads) */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex:-1,
        background:'radial-gradient(130% 90% at 50% -6%, rgba(215,255,54,0.22), rgba(120,150,20,0.05) 38%, transparent 62%), radial-gradient(80% 60% at 80% 110%, rgba(91,157,255,0.12), transparent 60%), #0a0c04' }}/>

      {/* footage -> page handoff (transition mask, not a scrim behind text) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] hero-foot"/>

      {/* content rises OUT of the footage via the gradient mask */}
      <div ref={contentRef} className="hero-mask relative z-10 mx-auto flex h-full max-w-[1320px] flex-col items-center justify-center px-5 pb-[7vh] text-center">
        <Reveal as="div" delay={0} y={14}>
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/15 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-acid live-dot"/>{t('hero_kicker')}
          </span>
        </Reveal>

        <h1 className="font-display mt-6 w-full leading-[0.92] tracking-[-0.015em]"
            style={{ fontSize:'clamp(2.4rem, 6.6vw, 5.6rem)', textWrap:'balance' }}>
          <span className="block text-white">{t('hero_h1a')}</span>
          <span className="block"><span className="text-acid">{t('hero_h1b')} </span><span className="text-white">{t('hero_h1c')}</span></span>
        </h1>

        <Reveal delay={260} y={18}>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-lg">{t('hero_sub')}</p>
        </Reveal>

        <Reveal delay={380} y={18}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Btn size="lg" variant="primary" onClick={()=>setRoute('markets')}>{t('hero_cta1')} <Icon.arrow/></Btn>
            <Btn size="lg" variant="outline" as="a" href="#how">{t('hero_cta2')}</Btn>
          </div>
        </Reveal>
      </div>

      {/* scroll hint */}
      <div ref={hintRef} className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 text-white/60">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{t('scroll_hint')}</span>
        <span className="h-9 w-5 rounded-full ring-1 ring-white/30">
          <span className="mx-auto mt-1.5 block h-1.5 w-1.5 rounded-full bg-acid" style={{ animation:'scrollDot 1.6s ease-in-out infinite' }}/>
        </span>
      </div>
      <style>{`@keyframes scrollDot{0%{transform:translateY(0);opacity:1}70%{transform:translateY(12px);opacity:0}100%{opacity:0}}`}</style>
    </section>
  );
}

/* ---------- stats strip ---------- */
function StatsStrip(){
  const { t, lang } = useT();
  const data = [
    { v:String(ALL_MARKETS.length), l:lang==='zh'?'市场':'Markets' },
    { v:'3', l:lang==='zh'?'类别':'Categories' },
    { v:'BSC', l:lang==='zh'?'BNB 链 · 56':'BNB Chain · 56' },
    { v:'1%', l:lang==='zh'?'平台费':'Platform fee' },
    { v:lang==='zh'?'链上':'On-chain', l:lang==='zh'?'结算':'Settlement' },
  ];
  return (
    <section className="border-b border-white/8 bg-ink-950">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 divide-x divide-y divide-white/8 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {data.map((s,i)=>(
          <Reveal key={i} delay={i*70} className="px-5 py-7 sm:px-7 sm:py-9">
            <div className="font-display text-4xl text-white sm:text-5xl">{s.v}</div>
            <div className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-white/45">{s.l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */
function HowItWorks({ setRoute }){
  const { t } = useT();
  const sw = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' };
  const steps = [
    // 01 Pick: crosshair / choose an outcome
    { n:'01', t:t('how_1t'), d:t('how_1d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>) },
    // 02 Buy with BNB: BNB diamond
    { n:'02', t:t('how_2t'), d:t('how_2d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/><path d="M9 12l3-3 3 3-3 3z"/></svg>) },
    // 03 Sell before close: swap arrows
    { n:'03', t:t('how_3t'), d:t('how_3d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><path d="M4 9h13l-3.5-3.5"/><path d="M20 15H7l3.5 3.5"/></svg>) },
    // 04 Settled on-chain: shield check
    { n:'04', t:t('how_4t'), d:t('how_4d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><path d="M12 3l7 3v5.5c0 4-3 6.8-7 8-4-1.2-7-4-7-8V6z"/><path d="M9 12l2 2 4-4"/></svg>) },
  ];
  return (
    <section id="how" className="relative bg-ink-950 py-20 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t('how_kicker')}</span>
          <h2 className="font-display mt-3 max-w-2xl text-4xl leading-[0.95] text-white sm:text-6xl">{t('how_h')}</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s,i)=>(
            <Reveal key={s.n} delay={i*90}>
              <div className="group h-full rounded-2xl border border-white/8 bg-ink-900 p-6 transition-colors hover:border-acid/40">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-acid">{s.n}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-acid/10 text-acid ring-1 ring-acid/20 transition-colors group-hover:bg-acid/20">{s.ic}</span>
                </div>
                <h3 className="font-display mt-8 text-2xl text-white">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- match schedule ---------- */
function MatchSchedule({ setRoute }){
  const { lang } = useT();
  const [now, setNow] = useState(()=>Date.now());

  useEffect(()=>{
    const id = setInterval(()=>setNow(Date.now()), 60_000);
    return ()=>clearInterval(id);
  },[]);

  const upcoming = useMemo(()=>
    MATCHES
      .filter(m=>{ const s=marketStatus(m,now); return s==='open'||s==='soon'; })
      .sort((a,b)=>a.closeTime-b.closeTime)
      .slice(0,12)
  ,[now]);

  const fmtDay  = (ts)=>new Date(ts).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const fmtTime = (ts)=>new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
  const tzLabel = useMemo(()=>{
    try { return new Date().toLocaleTimeString('en-US',{timeZoneName:'short'}).split(' ').pop() || 'local'; }
    catch { return 'local'; }
  },[]);

  const days = useMemo(()=>{
    const map = new Map();
    upcoming.forEach(m=>{
      const key = new Date(m.closeTime).toDateString();
      if(!map.has(key)) map.set(key,{ label:fmtDay(m.closeTime), matches:[] });
      map.get(key).matches.push(m);
    });
    return [...map.values()];
  },[upcoming]);

  if(!upcoming.length) return null;

  return (
    <section className="bg-ink-950 border-t border-white/8 py-20 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">
            {lang==='zh'?'赛程':'Schedule'}
          </span>
          <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">
            {lang==='zh'?'近期赛事':'Upcoming matches'}
          </h2>
          <p className="mt-3 text-sm text-white/45">
            {lang==='zh'
              ?`投注在开赛时关闭 · 时间为本地时间 (${tzLabel})`
              :`Betting closes at kickoff · All times in your local timezone (${tzLabel})`}
          </p>
        </Reveal>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/8 bg-ink-900">
          {days.map(({label,matches})=>(
            <div key={label}>
              <div className="border-b border-white/8 bg-ink-950/50 px-5 py-2.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-acid/70">{label}</span>
              </div>
              {matches.map(m=>{
                const home = TEAM(m.teams[0]);
                const away = TEAM(m.teams[1]??m.teams[0]);
                const homeOut = m.outcomes.find(o=>o.id==='home')||m.outcomes[0];
                const drawOut = m.outcomes.find(o=>o.kind==='draw')||m.outcomes[1];
                const awayOut = m.outcomes.find(o=>o.id==='away')||m.outcomes[2];
                const isSoon  = marketStatus(m,now)==='soon';
                return (
                  <div key={m.id} onClick={()=>setRoute('markets')}
                    className="group flex flex-col gap-3 border-b border-white/6 px-5 py-4 last:border-0 cursor-pointer transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-0">
                    {/* home */}
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <FlagChip code={home.code} size={32}/>
                      <span className="truncate text-sm font-semibold text-white">{lang==='zh'?home.zh:home.en}</span>
                    </div>
                    {/* odds */}
                    <div className="flex shrink-0 items-center gap-1.5 sm:px-5">
                      <span className="rounded-md bg-white/8 px-2.5 py-1.5 font-mono text-xs text-white">{fmtPct(homeOut.prob)}</span>
                      <span className="rounded-md bg-white/5 px-2.5 py-1 font-mono text-xs text-white/35">{fmtPct(drawOut.prob)}</span>
                      <span className="rounded-md bg-white/8 px-2.5 py-1.5 font-mono text-xs text-white">{fmtPct(awayOut.prob)}</span>
                    </div>
                    {/* away */}
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:flex-row-reverse">
                      <FlagChip code={away.code} size={32}/>
                      <span className="truncate text-sm font-semibold text-white sm:text-right">{lang==='zh'?away.zh:away.en}</span>
                    </div>
                    {/* meta */}
                    <div className="flex shrink-0 items-center gap-3 sm:border-l sm:border-white/8 sm:pl-6">
                      {isSoon&&(
                        <span className="rounded-full bg-acid/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-acid">
                          {lang==='zh'?'即将':'SOON'}
                        </span>
                      )}
                      <div className="text-right">
                        <div className="font-mono text-sm text-white/70">{fmtTime(m.closeTime)}</div>
                        <div className="font-mono text-[11px] text-white/30">{fmtBNB(m.poolBNB)} BNB</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Btn size="lg" variant="outline" onClick={()=>setRoute('markets')}>
            {lang==='zh'?`查看全部 ${MATCHES.length} 场比赛`:`View all ${MATCHES.length} matches`}
            <Icon.arrow/>
          </Btn>
        </div>
      </div>
    </section>
  );
}

/* ---------- closing CTA ---------- */
function ClosingCTA({ setRoute }){
  const { t } = useT();
  return (
    <section className="relative overflow-hidden bg-acid text-ink-950">
      <div className="grain absolute inset-0 opacity-40"/>
      <div className="relative mx-auto max-w-[1320px] px-5 py-20 text-center sm:px-6 sm:py-28">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-950/60">{t('close_kicker')}</span>
          <h2 className="font-display mx-auto mt-4 max-w-4xl leading-[0.9] tracking-tight" style={{ fontSize:'clamp(2.8rem,9vw,7rem)' }}>{t('close_h')}</h2>
          <p className="mx-auto mt-5 max-w-lg text-base font-medium text-ink-950/70 sm:text-lg">{t('close_sub')}</p>
          <div className="mt-9 flex justify-center">
            <button onClick={()=>setRoute('markets')}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-ink-950 px-8 py-4 text-sm font-bold uppercase tracking-wide text-acid transition-transform hover:scale-[1.02] active:scale-100">
              {t('close_cta')} <span className="transition-transform group-hover:translate-x-1"><Icon.arrow/></span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
function Footer(){
  const { t, lang } = useT();
  return (
    <footer className="border-t border-white/8 bg-ink-950">
      <div className="mx-auto max-w-[1320px] px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo size={20}/>
            <p className="mt-4 text-sm leading-relaxed text-white/45">
              {lang==='zh'
                ? 'BNB 链上的世界杯预测市场。结果由 BSC 上的 WorldCupViewer 合约链上结算。数据为示意。'
                : 'World Cup prediction markets on BNB Chain. Outcomes settle on-chain via the WorldCupViewer contract on BSC. Figures are illustrative.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6 font-mono text-xs text-white/55">
            <div><div className="mb-2 text-white/35">CHAIN</div>BNB Chain (BSC)<br/>chainId 56</div>
            <div><div className="mb-2 text-white/35">FEE</div>1% on buy<br/>non-refundable</div>
            <div><div className="mb-2 text-white/35">RESERVED IDS</div>49 · Others<br/>50 · Draw</div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/8 pt-6 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Polyflap · Not affiliated with FIFA. Bet responsibly.</span>
          <span className="font-mono">Settlement: WorldCupViewer · BSC</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- about ---------- */
function AboutPage({ setRoute }){
  const { lang } = useT();
  const t2 = (en,zh)=> lang==='zh'?zh:en;
  const specs = [
    { k:t2('Network','网络'), v:'BNB Smart Chain' },
    { k:t2('Login','登录'), v:t2('Wallet-first via Privy','通过 Privy 优先钱包登录') },
    { k:t2('Main wallet','主钱包'), v:'MetaMask / BNB wallets' },
    { k:t2('Markets','市场'), v:t2('World Cup 2026','2026 世界杯') },
    { k:t2('Leaderboard','排行榜'), v:t2('On-chain top bettors','链上投注排行榜') },
    { k:t2('Factory','工厂'), v:t2('Audited production','已审计正式版') },
    { k:t2('Token/Vault','代币/金库'), v:t2('Live on BNB Chain','已在 BNB Chain 上线') },
    { k:t2('Custody','托管'), v:t2('Non-custodial','非托管') },
  ];
  const productCards = [
    {
      n:'01',
      title:t2('Audited World Cup markets','已审计的世界杯市场'),
      body:t2('Polyflap now uses the audited live contract set on BNB Chain: the POLYFLAP token, Flap vault clone, Flap-compatible factory, beacon-backed vault implementation and auxiliary betting vault.','Polyflap 现在使用 BNB Chain 上已审计的线上合约：POLYFLAP 代币、Flap 金库克隆、兼容 Flap 的工厂、Beacon 支持的金库实现，以及辅助投注金库。'),
    },
    {
      n:'02',
      title:t2('World Cup positions with real wallet signing','真实钱包签名的世界杯仓位'),
      body:t2('Users connect a BNB Chain wallet, choose a World Cup market and sign each BNB-backed position from their own wallet. The app never places a bet without wallet confirmation.','用户连接 BNB Chain 钱包，选择世界杯市场，并从自己的钱包签名每个 BNB 支持的仓位。应用不会在没有钱包确认的情况下下注。'),
    },
    {
      n:'03',
      title:t2('Portfolio built from live positions','基于实时仓位的 Portfolio'),
      body:t2("After connecting, the Portfolio shows the user's active positions and available actions: withdraw while a market is open, claim winning outcomes, or receive refunds when a market is voided.",'连接后，Portfolio 显示用户的活跃仓位和可用操作：市场开放时撤回、获胜后领取，或在市场作废时退款。'),
    },
    {
      n:'04',
      title:t2('Public leaderboard','公开排行榜'),
      body:t2('The Leaderboard ranks real wallets from BNB Chain contract reads. It shows top bettors and market activity without needing a private database. Reward forwarding/claiming is disabled in the current audited package, so leaderboard data is informational.','Leaderboard 通过 BNB Chain 合约读取真实钱包排名。它显示顶级投注者和市场活动，不需要私有数据库。当前已审计版本禁用了奖励转发/领取，因此排行榜数据仅供信息展示。'),
    },
  ];
  const userFlow = [
    {
      title:t2('1. Connect wallet','1. 连接钱包'),
      body:t2('Open the app and connect with MetaMask or another supported BNB Chain wallet through Privy. Wallet login is the recommended live path.','打开应用，通过 Privy 使用 MetaMask 或其他支持的 BNB Chain 钱包连接。钱包登录是推荐的线上路径。'),
    },
    {
      title:t2('2. Use BNB on BSC','2. 使用 BSC 上的 BNB'),
      body:t2('The connected wallet needs BNB on BNB Smart Chain for the position amount and gas. Every market action is confirmed from the wallet.','连接的钱包需要在 BNB Smart Chain 上有 BNB，用于仓位金额和 gas。每个市场操作都从钱包确认。'),
    },
    {
      title:t2('3. Pick and sign','3. 选择并签名'),
      body:t2('Browse match, group and tournament markets, choose an outcome, enter BNB amount and sign the transaction. The app shows fee and net stake before confirmation.','浏览单场、小组和锦标赛市场，选择结果，输入 BNB 金额并签名交易。应用在确认前显示费用和净仓位。'),
    },
    {
      title:t2('4. Track, withdraw, claim','4. 跟踪、撤回、领取'),
      body:t2('Portfolio keeps positions organized, while Leaderboard shows public top-bettor activity. Users can withdraw eligible open positions or claim after settlement.','Portfolio 管理仓位，Leaderboard 展示公开的顶级投注者活动。用户可撤回符合条件的开放仓位，或在结算后领取。'),
    },
  ];
  const chapters = [
    { n:'01', t:t2('What Polyflap is now','现在的 Polyflap 是什么'), ps:[
      t2('Polyflap is an audited, wallet-first World Cup prediction market running on BNB Chain. The POLYFLAP token, Flap vault, production factory and auxiliary betting vault are deployed and configured.','Polyflap 是运行在 BNB Chain 上、已审计、优先使用钱包的世界杯预测市场。POLYFLAP 代币、Flap 金库、正式工厂和辅助投注金库均已部署并配置。'),
      t2('The product should feel simple for normal football fans, but the important money movement remains verifiable through wallet signatures and public chain reads.','产品应让普通足球球迷也能轻松使用，同时关键资金流通过钱包签名和公开链上读取保持可验证。'),
    ] },
    { n:'02', t:t2('How users enter','用户如何进入'), ps:[
      t2('The current live flow should be explained as wallet-first: connect MetaMask or another supported BNB wallet through Privy, then operate on BNB Smart Chain.','当前线上流程应解释为优先钱包：通过 Privy 连接 MetaMask 或其他支持的 BNB 钱包，然后在 BNB Smart Chain 上操作。'),
      t2('Social login is not the core promise of the page. If it is enabled later, it should be presented as an optional onboarding method, not as the required trading path.','社交登录不是本页的核心承诺。如果之后启用，它应作为可选入门方式展示，而不是必需的交易路径。'),
    ] },
    { n:'03', t:t2('What users can do','用户可以做什么'), ps:[
      t2('Users can browse World Cup markets, place BNB-backed positions, monitor active positions, withdraw eligible open positions, and claim winning or refundable outcomes after settlement.','用户可以浏览世界杯市场、开立 BNB 支持的仓位、查看活跃仓位、撤回符合条件的开放仓位，并在结算后领取获胜或可退款结果。'),
      t2('Portfolio is the private management area for the connected wallet. Leaderboard is the public area for top-bettor activity and market visibility. In the audited production package, token-tax reward forwarding and betting reward claims are intentionally disabled, so reward panels should remain hidden or zero until the product design changes.','Portfolio 是连接钱包的私人管理区域。Leaderboard 是展示顶级投注者活动和市场可见性的公开区域。在已审计正式版本中，代币税奖励转发和投注奖励领取被有意禁用，因此奖励面板应保持隐藏或为零，直到产品设计改变。'),
    ] },
    { n:'04', t:t2('How funds and records work','资金和记录如何运作'), ps:[
      t2('Polyflap is non-custodial: customers keep their keys, and betting actions are transactions they approve from their own wallet. The app itself is not a deposit account and does not hold customer keys.','Polyflap 是非托管产品：客户保留自己的私钥，投注操作是他们从自己钱包批准的交易。应用本身不是充值账户，也不持有客户私钥。'),
      t2('The betting contract handles positions, withdrawals, claims, refunds and leaderboard accounting. Standard BSC gas applies, and the app shows transaction state while actions confirm.','投注合约处理仓位、撤回、领取、退款和排行榜统计。需要标准 BSC gas，应用会在操作确认期间显示交易状态。'),
    ] },
    { n:'05', t:t2('Trust and safety','信任与安全'), ps:[
      t2('The About page avoids internal deployment details while still explaining the customer-facing mechanics: wallet connection, BNB markets, portfolio actions and public leaderboard reads.','About 页面避免内部部署细节，同时解释面向客户的机制：钱包连接、BNB 市场、Portfolio 操作和公开排行榜读取。'),
      t2('Polyflap is not affiliated with FIFA and does not provide financial advice. Users should only participate with funds they are willing to risk.','Polyflap 与 FIFA 无关联，也不提供财务建议。用户只应使用自己愿意承担风险的资金参与。'),
    ] },
  ];
  const roadmap = [
    {
      step:t2('Finish Flap token launch','完成 Flap 代币发射'),
      text:t2('When the real POLYFLAP token is launched through Flap, the final token and vault addresses will be added to the app and verified on-chain.','当真正的 POLYFLAP 代币通过 Flap 发射后，最终代币和金库地址会添加到应用并进行链上验证。'),
    },
    {
      step:t2('Seed and open production markets','创建并开放正式市场'),
      text:t2('After contract wiring is complete, World Cup markets can be seeded and opened with clear close times, settlement rules and portfolio actions.','合约连接完成后，可以创建并开放世界杯市场，包含清晰的关闭时间、结算规则和 Portfolio 操作。'),
    },
    {
      step:t2('Low Risk badge after launch','上线后申请 Low Risk 标记'),
      text:t2('Once the real token is live, Flap can apply the Low Risk badge to the launched token/vault flow.','真实代币上线后，Flap 可以为发射后的代币/金库流程添加 Low Risk 标记。'),
    },
  ];
  const contractRows = [
    ['Factory', FLAP_VAULT_FACTORY_ADDRESS],
    ['Implementation', FLAP_VAULT_IMPLEMENTATION_ADDRESS],
    ['Beacon', FLAP_VAULT_BEACON_ADDRESS],
    ['Betting vault', BETTING_VAULT_ADDRESS],
    ['WorldCupViewer', WORLD_CUP_VIEWER_ADDRESS],
    ['POLYFLAP token', FLAP_TOKEN_ADDRESS || 'Not configured'],
    ['Flap vault', VAULT_ADDRESS || 'Not configured'],
  ];
  const short = (v)=> typeof v === 'string' && v.startsWith('0x') ? `${v.slice(0,6)}…${v.slice(-4)}` : v;
  const scan = (v)=> typeof v === 'string' && v.startsWith('0x') ? `https://bscscan.com/address/${v}` : undefined;
  return (
    <main className="bg-ink-950 pt-20">
      {/* hero */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="grain pointer-events-none absolute inset-0 opacity-30"/>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full" style={{ background:'radial-gradient(circle, rgba(215,255,54,0.16), transparent 65%)' }}/>
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('About Polyflap','关于 Polyflap')}</span>
            <h1 className="font-display mt-3 text-5xl leading-[0.92] text-white sm:text-7xl">{t2('A clearer way to play World Cup markets on-chain.','更清晰地参与链上世界杯市场。')}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">{t2('Polyflap is a BNB Chain prediction-market app for football fans. Connect, choose a World Cup outcome, place a BNB-backed position, then manage withdrawals, claims or refunds from one simple portfolio.','Polyflap 是面向足球球迷的 BNB Chain 预测市场应用。连接账户，选择世界杯结果，用 BNB 开仓，然后在一个简单的 Portfolio 中管理撤回、领取或退款。')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn onClick={()=>setRoute('markets')}>{t2('Explore markets','浏览市场')} <Icon.arrow/></Btn>
              <Btn variant="outline" onClick={()=>setRoute('portfolio')}>{t2('My portfolio','我的持仓')}</Btn>
            </div>
          </Reveal>
          <Reveal delay={120} className="hidden justify-self-center lg:block">
            <img src="/brand-logo.png" alt="Polyflap" className="w-[300px]" style={{ filter:'drop-shadow(0 16px 50px rgba(215,255,54,0.25))' }}/>
          </Reveal>
        </div>
      </section>

      {/* spec sheet */}
      <section className="border-b border-white/8 bg-ink-950">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 divide-x divide-y divide-white/8 sm:grid-cols-4 lg:grid-cols-8 lg:divide-y-0">
          {specs.map((s,i)=>(
            <Reveal key={i} delay={i*60} className="px-5 py-7">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{s.k}</div>
              <div className="font-mono mt-1.5 text-sm text-acid">{s.v}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* contract status */}
      <section className="border-b border-white/8 bg-ink-950 py-12 sm:py-16">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Production contracts','正式合约')}</span>
            <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">{t2('Audited factory is live. Token and vault are next.','已审计工厂已上线。代币和金库下一步。')}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">{t2('These are the active BNB Chain contracts the app is wired to. The final POLYFLAP token and Flap vault stay pending until the real Flap launch creates them.','这些是应用当前连接的 BNB Chain 合约。最终 POLYFLAP 代币和 Flap 金库会保持待定，直到真实 Flap 发射创建它们。')}</p>
          </Reveal>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {contractRows.map(([label,value])=>{
              const href = scan(value);
              const body = <><div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div><div className="mt-1 font-mono text-sm text-acid">{short(value)}</div></>;
              return href ? <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/8 bg-ink-900 p-4 transition hover:border-acid/40">{body}</a> : <div key={label} className="rounded-2xl border border-white/8 bg-ink-900 p-4">{body}</div>;
            })}
          </div>
        </div>
      </section>

      {/* what it does */}
      <section className="border-b border-white/8 bg-ink-950 py-16 sm:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('What the app does','应用能做什么')}</span>
            <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">{t2('Everything a customer needs, without developer clutter.','客户需要的功能，没有开发者杂音。')}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">{t2('This page explains the product in plain language. Internal contract addresses, operator setup and deployment details are intentionally kept out of the customer About page.','本页面用简单语言解释产品。内部合约地址、操作员配置和部署细节故意不出现在客户 About 页面。')}</p>
          </Reveal>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {productCards.map((card,i)=>(
              <Reveal key={card.n} delay={i*50}>
                <div className="h-full rounded-2xl border border-white/8 bg-ink-900 p-5">
                  <div className="font-mono text-sm text-acid">{card.n}</div>
                  <h3 className="font-display mt-5 text-xl text-white">{card.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* customer flow */}
      <section className="border-b border-white/8 bg-ink-950 py-16 sm:py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Customer flow','客户流程')}</span>
            <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">{t2('From login to payout.','从登录到领取。')}</h2>
          </Reveal>
          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {userFlow.map((step,i)=>(
              <Reveal key={step.title} delay={i*50}>
                <div className="h-full rounded-2xl border border-white/8 bg-ink-900 p-5">
                  <h3 className="font-display text-xl text-white">{step.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-white/50">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* guide */}
      <section className="bg-ink-950 py-20 sm:py-24">
        <div className="mx-auto max-w-[920px] px-5 sm:px-6">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Customer guide','Guía para clientes')}</span>
            <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">{t2('How Polyflap works','Cómo funciona Polyflap')}</h2>
          </Reveal>
          <div className="mt-14 flex flex-col gap-12">
            {chapters.map((c,i)=>(
              <Reveal key={c.n} delay={i*50}>
                <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
                  <div className="font-mono text-2xl text-acid/80">{c.n}</div>
                  <div>
                    <h3 className="font-display text-2xl text-white">{c.t}</h3>
                    <div className="mt-3 flex flex-col gap-3">
                      {c.ps.map((p,j)=>(<p key={j} className="text-[15px] leading-relaxed text-white/60">{p}</p>))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-16 rounded-3xl border border-acid/20 bg-acid/[0.04] p-6 sm:p-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Roadmap','路线图')}</span>
              <h3 className="font-display mt-3 text-3xl leading-none text-white sm:text-4xl">{t2('Where Polyflap can go next','Polyflap 下一步可以走向哪里')}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">{t2('If everything goes well, Polyflap can grow from football into a broader prediction app. New categories should be added carefully, with clear rules before users rely on them.','如果一切顺利，Polyflap 可以从足球扩展为更广泛的预测应用。新类别应谨慎加入，并在用户依赖前具备清晰规则。')}</p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {roadmap.map((item,i)=>(
                  <div key={item.step} className="rounded-2xl border border-white/8 bg-ink-900/80 p-5">
                    <div className="font-mono text-sm text-acid">0{i+1}</div>
                    <h4 className="font-display mt-4 text-xl text-white">{item.step}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal>
            <p className="mt-14 border-t border-white/8 pt-6 text-xs leading-relaxed text-white/35">{t2('Customer information only. Not financial advice. Not affiliated with FIFA. Betting involves risk; participate responsibly.','仅供客户了解产品。非财务建议。与 FIFA 无关。投注有风险，请理性参与。')}</p>
          </Reveal>
        </div>
      </section>

      <ClosingCTA setRoute={setRoute}/>
      <Footer/>
    </main>
  );
}

/* ---------- home page ---------- */
function HomePage({ setRoute }){
  return (
    <main>
      <Hero setRoute={setRoute} />
      <StatsStrip/>
      <HowItWorks setRoute={setRoute}/>
      <MatchSchedule setRoute={setRoute}/>
      <ClosingCTA setRoute={setRoute}/>
      <Footer/>
    </main>
  );
}

export { HERO_VIDEO_SRC, Reveal, Nav, Ticker, Hero, StatsStrip, HowItWorks, MatchSchedule, ClosingCTA, Footer, HomePage, AboutPage };
