// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap — Home / Landing
   ============================================================ */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useT, marketTitle, teamName } from './i18n';
import { Logo, LangToggle, ConnectButton, Btn, Icon, FlagChip } from './components';
import { MATCHES, GROUP_MARKETS, TOURNAMENT_MARKET, ALL_MARKETS, fmtPct } from './data';
import {
  BETTING_VAULT_ADDRESS,
  FLAP_TOKEN_ADDRESS,
  FLAP_VAULT_FACTORY_ADDRESS,
  FLAP_VAULT_IMPLEMENTATION_ADDRESS,
  VAULT_ADDRESS,
  WORLD_CUP_VIEWER_ADDRESS,
} from '../lib/env';
import { shortAddress } from '../lib/format';

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
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid?'bg-ink-950/85 backdrop-blur-xl border-b border-white/8':'bg-transparent'}`}>
      <div className="mx-auto flex h-20 max-w-[1320px] items-center gap-5 px-4 sm:px-6">
        <Logo onClick={()=>setRoute('home')} size={28} />
        <nav className="ml-5 hidden items-center gap-1.5 md:flex">
          {links.map(l=>(
            <button key={l.k} onClick={l.go}
              className={`group relative rounded-lg px-4 py-2.5 text-[16px] font-semibold transition-colors ${route===l.k?'text-acid':'text-white hover:text-acid'} ${l.soon?'cursor-default':''}`}>
              {l.label}
              {l.soon && <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/50 align-middle">{t('soon_badge')}</span>}
              {route===l.k && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-acid"/>}
            </button>
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
                <button key={l.k} onClick={()=>{ l.go && l.go(); setMenu(false); }}
                  className={`flex items-center justify-between rounded-xl px-3 py-3.5 text-left text-lg font-bold uppercase tracking-tight ${route===l.k?'bg-acid/12 text-acid':'text-white/85'}`}>
                  {l.label}{l.soon && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{t('soon_badge')}</span>}
                </button>
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
      {/* full-bleed footage at 100% opacity — no dark overlay box */}
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
    // 01 Pick — crosshair / choose an outcome
    { n:'01', t:t('how_1t'), d:t('how_1d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>) },
    // 02 Buy with BNB — BNB diamond
    { n:'02', t:t('how_2t'), d:t('how_2d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/><path d="M9 12l3-3 3 3-3 3z"/></svg>) },
    // 03 Sell before close — swap arrows
    { n:'03', t:t('how_3t'), d:t('how_3d'), ic:(<svg viewBox="0 0 24 24" width="22" height="22" {...sw}><path d="M4 9h13l-3.5-3.5"/><path d="M20 15H7l3.5 3.5"/></svg>) },
    // 04 Settled on-chain — shield check
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
                ? 'BNB 链上的世界杯预测市场。结果由 BSC 上的 WorldCupViewer 合约链上结算。仅供演示，数据为示意。'
                : 'World Cup prediction markets on BNB Chain. Outcomes settle on-chain via the WorldCupViewer contract on BSC. Demo build — figures are illustrative.'}
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
    { k:t2('Network','网络'), v:'BNB Smart Chain · 56' },
    { k:t2('Settlement','结算'), v:'WorldCupViewer' },
    { k:t2('Protocol fee','协议费'), v:'1% / buy' },
    { k:t2('Markets','市场'), v:'85' },
    { k:t2('Custody','托管'), v:t2('Non-custodial','非托管') },
    { k:t2('Stack','技术栈'), v:'Privy · viem' },
  ];
  const bscScan = (address?: string) => address ? `https://bscscan.com/address/${address}` : undefined;
  const contractRows = [
    {
      label: t2('Flap vault factory','Flap 金库 Factory'),
      value: FLAP_VAULT_FACTORY_ADDRESS,
      note: t2('Fixed factory for the next final Flap launch.','下一次正式 Flap 发行使用的已修复 factory。'),
    },
    {
      label: t2('Vault implementation','金库实现'),
      value: FLAP_VAULT_IMPLEMENTATION_ADDRESS,
      note: t2('Clone implementation used by the fixed factory.','已修复 factory 使用的 clone implementation。'),
    },
    {
      label: t2('Betting vault','投注金库'),
      value: BETTING_VAULT_ADDRESS,
      note: t2('Live BNB escrow for buy / sell / claim flows.','处理买入 / 卖出 / 领取流程的实时 BNB 托管合约。'),
    },
    {
      label: t2('WorldCupViewer','WorldCupViewer'),
      value: WORLD_CUP_VIEWER_ADDRESS,
      note: t2('On-chain settlement truth source on BSC.','BSC 上的链上结算真相来源。'),
    },
    {
      label: t2('Final Flap token','最终 Flap 代币'),
      value: FLAP_TOKEN_ADDRESS,
      note: t2('Unset here until the final token launch. The temporary launch is intentionally not used.','正式发行前这里保持未设置。临时发行不会被使用。'),
      pending: true,
    },
    {
      label: t2('Active Flap vault clone','当前 Flap 金库 clone'),
      value: VAULT_ADDRESS,
      note: t2('Unset until the final Flap token creates the real vault clone.','最终 Flap 代币创建真实金库 clone 前保持未设置。'),
      pending: true,
    },
  ];
  const rewardSteps = [
    {
      n: '01',
      title: t2('Trade the Flap token','交易 Flap 代币'),
      body: t2('When the final Flap token is live, its trading taxes are received by the Flap vault in BNB. The token/vault addresses stay unset here until that final launch.','最终 Flap 代币上线后，交易税会以 BNB 进入 Flap 金库。在正式发行前，代币 / 金库地址会保持未设置。'),
    },
    {
      n: '02',
      title: t2('Vault forwards taxes','金库转发税收'),
      body: t2('The vault does not distribute token taxes to passive holders. The operator/guardian can forward collected BNB tax revenue into the betting vault reward pool.','金库不会把代币税分给被动持有人。operator/guardian 可以把收集到的 BNB 税收转入投注金库奖励池。'),
    },
    {
      n: '03',
      title: t2('Bettors earn reward shares','下注者获得奖励份额'),
      body: t2('Only users who place real BNB bets receive reward shares. Shares are based on net stake after the 1% entry fee; withdrawing an open bet removes the withdrawn shares.','只有真实用 BNB 下注的用户会获得奖励份额。份额按扣除 1% 入场费后的净本金计算；在市场关闭前撤回下注会移除对应份额。'),
    },
    {
      n: '04',
      title: t2('Bettors claim tax rewards','下注者领取税收奖励'),
      body: t2('When tax rewards are deposited, they are allocated pro-rata to current betting reward shares. Claiming is done by bettors from the betting vault, separate from match-winner payouts.','税收奖励存入后，会按当前投注奖励份额按比例分配。领取由下注者在投注金库完成，和比赛胜者赔付是两条独立流程。'),
    },
  ];
  const chapters = [
    { n:'01', t:t2('What Polyflap is','Polyflap 是什么'), ps:[
      t2('Polyflap is a World Cup prediction-market product built on BNB Smart Chain. Clients use a Privy wallet, pick a World Cup market, and place BNB behind the outcome they believe will win.','Polyflap 是构建在 BNB Smart Chain 上的世界杯预测市场产品。客户使用 Privy 钱包，选择世界杯市场，并用 BNB 支持自己认为会获胜的结果。'),
      t2('The experience is simple for users, but the accounting is on-chain: every bet, sell/withdraw, claim, refund and tax-reward claim is a transaction that can be checked on BscScan.','用户体验保持简单，但账本在链上：每次下注、卖出/撤回、领取、退款和税收奖励领取都可在 BscScan 上验证。'),
    ] },
    { n:'02', t:t2('Two vaults, two jobs','两个金库，两种职责'), ps:[
      t2('The Flap vault belongs to the Flap token. It receives BNB tax revenue from the token and exposes the clean UI schema that lets Flap render the product correctly.','Flap 金库属于 Flap 代币。它接收来自代币的 BNB 税收，并暴露干净的 UI schema，让 Flap 能正确渲染产品。'),
      t2('The betting vault is the customer-facing escrow. It holds user BNB stakes, tracks every market and position, pays winners, refunds cancelled markets, and distributes forwarded tax rewards to bettors.','投注金库是面向客户的托管层。它持有用户 BNB 本金，记录每个市场和仓位，向赢家支付，给取消市场退款，并把转入的税收奖励分配给下注者。'),
    ] },
    { n:'03', t:t2('How betting works','下注如何运作'), ps:[
      t2('85 markets cover match winners, group winners and the tournament winner. Each outcome has a teamId; Draw and Others are reserved outcomes where needed.','85 个市场覆盖单场胜者、小组胜者和总冠军。每个结果都有 teamId；需要时使用 Draw 和 Others 作为保留结果。'),
      t2('A buy calls placeBet(marketId, teamId) with BNB. The 1% entry fee is paid immediately and the remaining net stake enters that outcome pool. Before the market closes, users can reduce or exit with withdrawBet; only the net stake is withdrawable, not the already-paid fee.','买入会调用 placeBet(marketId, teamId) 并发送 BNB。1% 入场费会立即支付，剩余净本金进入对应结果池。市场关闭前，用户可以用 withdrawBet 减仓或退出；可撤回的是净本金，不包括已经支付的费用。'),
    ] },
    { n:'04', t:t2('Who can claim token-tax rewards','谁能领取代币税收奖励'), ps:[
      t2('This is the key mechanic: Flap token tax revenue is not a passive holder dividend. It is designed as an incentive for people who actually participate in the World Cup betting markets.','这是核心机制：Flap 代币税收不是被动持币分红。它被设计成给真正参与世界杯预测市场的用户的激励。'),
      t2('When BNB tax revenue reaches the Flap vault, it can be forwarded to the betting vault. The betting vault allocates that BNB pro-rata by betting reward shares, so only wallets with betting activity and reward shares can claim it.','当 BNB 税收到达 Flap 金库后，可以转入投注金库。投注金库会按投注奖励份额按比例分配这些 BNB，因此只有有下注活动和奖励份额的钱包可以领取。'),
      t2('Match winnings and tax rewards are separate. Winning a market lets you claim the market payout; having reward shares lets you claim your share of forwarded token-tax rewards.','比赛赔付和税收奖励是两条独立流程。赢得市场可以领取市场赔付；拥有奖励份额可以领取转入的代币税收奖励。'),
    ] },
    { n:'05', t:t2('Settlement and payouts','结算与赔付'), ps:[
      t2('There is no manual oracle. When a match or stage resolves, the result is read on-chain from Flap’s WorldCupViewer contract: tournament winner, group winners, or individual match results.','没有人工预言机。当比赛或阶段结束时，结果从 Flap 的 WorldCupViewer 合约链上读取：总冠军、小组胜者或单场比赛结果。'),
      t2('Anyone can trigger settlement after the configured time, but the winning team still comes from WorldCupViewer. Winning positions become claimable; cancelled or voided markets become refundable.','到达配置时间后任何人都可以触发结算，但获胜队伍仍只来自 WorldCupViewer。获胜仓位变为可领取；取消或无效市场变为可退款。'),
    ] },
    { n:'06', t:t2('Security and trust model','安全与信任模型'), ps:[
      t2('Polyflap is non-custodial: users keep their wallets, sign their own transactions, and funds live in contracts rather than in a company account.','Polyflap 是非托管的：用户保留自己的钱包，自己签名交易，资金存在合约中而不是公司账户中。'),
      t2('Every write is dry-run with simulateContract before the wallet asks for a signature, so closed markets, invalid outcomes or impossible withdrawals fail before users spend gas.','每个写入操作都会在钱包请求签名前先用 simulateContract 预演，因此已关闭市场、无效结果或不可能的撤回会在用户花费 gas 前失败。'),
    ] },
  ];
  return (
    <main className="bg-ink-950 pt-20">
      {/* hero */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="grain pointer-events-none absolute inset-0 opacity-30"/>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full" style={{ background:'radial-gradient(circle, rgba(215,255,54,0.16), transparent 65%)' }}/>
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('About','关于')}</span>
            <h1 className="font-display mt-3 text-5xl leading-[0.92] text-white sm:text-7xl">{t2('Bet the World Cup, on-chain.','链上竞猜世界杯。')}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">{t2('Polyflap is a World Cup prediction market on BNB Chain where betting is also the participation layer for token-tax rewards. Back a team with BNB, receive betting reward shares, and claim eligible rewards on-chain.','Polyflap 是 BNB 链上的世界杯预测市场，投注也是代币税收奖励的参与层。用 BNB 支持球队，获得投注奖励份额，并在链上领取符合条件的奖励。')}</p>
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
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 divide-x divide-y divide-white/8 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {specs.map((s,i)=>(
            <Reveal key={i} delay={i*60} className="px-5 py-7">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{s.k}</div>
              <div className="font-mono mt-1.5 text-sm text-acid">{s.v}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* tax reward flow */}
      <section className="border-b border-white/8 bg-ink-950 py-14 sm:py-16">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
          <Reveal>
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Token tax rewards','代币税收奖励')}</span>
              <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">{t2('Token taxes reward bettors, not passive holders.','代币税奖励下注者，而不是被动持有人。')}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/55">{t2('Polyflap connects a Flap tax vault with a betting vault. Token trading taxes can be converted into a reward pool, but the right to claim that pool comes from betting activity: real BNB stake creates reward shares.','Polyflap 将 Flap 税收金库和投注金库连接起来。代币交易税可以变成奖励池，但领取这个奖励池的权利来自投注行为：真实 BNB 本金会产生奖励份额。')}</p>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {rewardSteps.map((step, i) => (
              <Reveal key={step.n} delay={i * 60} className="rounded-3xl border border-acid/10 bg-acid/[0.045] p-5">
                <div className="font-mono text-xl text-acid/80">{step.n}</div>
                <h3 className="font-display mt-4 text-2xl leading-none text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{step.body}</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-white/55">
              <strong className="text-white">{t2('Plain English:', '简单来说：')}</strong>{' '}
              {t2('holding the token alone does not make a wallet eligible for these BNB tax rewards. A user must participate in the markets, receive betting reward shares, and then claim from the betting vault when rewards are available.','仅持有代币不会让钱包自动获得这些 BNB 税收奖励资格。用户必须参与市场，获得投注奖励份额，并在奖励可用时从投注金库领取。')}
            </div>
          </Reveal>
        </div>
      </section>

      {/* contract registry */}
      <section className="border-b border-white/8 bg-ink-950 py-14 sm:py-16">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-6">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Contracts','合约')}</span>
                <h2 className="font-display mt-2 text-3xl leading-none text-white sm:text-4xl">{t2('Current BSC deployment map','当前 BSC 部署地图')}</h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-white/45">{t2('The temporary Flap token/vault from the test launch is intentionally not configured here. Only the fixed factory, implementation, betting vault and WorldCupViewer are active until the final launch.','测试发行中的临时 Flap 代币 / 金库不会配置在这里。正式发行前只启用已修复 factory、implementation、投注金库和 WorldCupViewer。')}</p>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {contractRows.map((row, i) => {
              const href = bscScan(row.value);
              return (
                <Reveal key={row.label} delay={i * 45} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.20)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{row.label}</div>
                      <div className="mt-2 font-mono text-sm text-acid">{row.value ? shortAddress(row.value) : t2('Unset','未设置')}</div>
                    </div>
                    {row.pending && <span className="rounded-full border border-yellow-300/25 bg-yellow-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-200">{t2('pending','待定')}</span>}
                  </div>
                  <p className="mt-3 min-h-[44px] text-xs leading-relaxed text-white/45">{row.note}</p>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-acid/40 hover:text-acid">
                      {t2('View on BscScan','在 BscScan 查看')} <Icon.arrow/>
                    </a>
                  ) : (
                    <div className="mt-4 rounded-full border border-dashed border-white/10 px-3 py-2 text-xs text-white/30">{t2('Will be added after final launch','正式发行后添加')}</div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* whitepaper */}
      <section className="bg-ink-950 py-20 sm:py-24">
        <div className="mx-auto max-w-[920px] px-5 sm:px-6">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t2('Protocol','协议')}</span>
            <h2 className="font-display mt-3 text-4xl leading-[0.95] text-white sm:text-5xl">{t2('How Polyflap works','Polyflap 如何运作')}</h2>
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
            <p className="mt-14 border-t border-white/8 pt-6 text-xs leading-relaxed text-white/35">{t2('Demo build — figures may be illustrative until on-chain volume exists. Not financial advice. Not affiliated with FIFA. Bet responsibly.','演示版本 — 在产生链上交易量之前，数据可能为示意。非财务建议。与 FIFA 无关。请理性下注。')}</p>
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
      <ClosingCTA setRoute={setRoute}/>
      <Footer/>
    </main>
  );
}

export { HERO_VIDEO_SRC, Reveal, Nav, Ticker, Hero, StatsStrip, HowItWorks, ClosingCTA, Footer, HomePage, AboutPage };
