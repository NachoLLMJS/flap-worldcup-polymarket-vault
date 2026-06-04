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
  const steps = [
    { n:'01', t:t('how_1t'), d:t('how_1d') },
    { n:'02', t:t('how_2t'), d:t('how_2d') },
    { n:'03', t:t('how_3t'), d:t('how_3d') },
    { n:'04', t:t('how_4t'), d:t('how_4d') },
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
                  <span className="h-8 w-8 rounded-full bg-white/5 transition-colors group-hover:bg-acid/15"/>
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
  const chapters = [
    { n:'01', t:t2('Architecture','架构'), ps:[
      t2('Polyflap runs entirely on BNB Smart Chain (BSC, chainId 56). Three on-chain roles: a betting vault that holds positions and processes buys and sells; the WorldCupViewer, the on-chain source of truth for results; and a factory + implementation pair that launches the Flap token and its vault.','Polyflap 完全运行在 BNB 智能链（BSC，链 ID 56）。三个链上角色：持有仓位并处理买卖的投注金库；作为结果链上真相来源的 WorldCupViewer；以及发行 Flap 代币及其金库的 factory + implementation。'),
      t2('The web app is a thin client: it signs through Privy-managed wallets using viem, and dry-runs every call with simulateContract before you sign.','网页端是轻客户端：通过 Privy 管理的钱包用 viem 签名，并在你签名前用 simulateContract 预演每一次调用。'),
    ] },
    { n:'02', t:t2('Markets & positions','市场与仓位'), ps:[
      t2('85 markets span the group stage, individual matches and the tournament winner. Each market exposes one outcome per team, plus reserved IDs 50 (Draw) and 49 (Others / the field).','85 个市场涵盖小组赛、单场比赛和总冠军。每个市场为每支球队提供一个结果，外加保留 ID 50（平局）和 49（其他 / 大盘）。'),
      t2('You open a position with placeBet(marketId, teamId), sending BNB as the stake, and reduce or exit before close with withdrawBet(marketId, teamId, amount). Stakes per outcome form the pool that backs payouts.','用 placeBet(marketId, teamId) 开仓并以 BNB 作为本金，用 withdrawBet(marketId, teamId, amount) 在截止前减仓或退出。各结果的本金构成支撑赔付的资金池。'),
    ] },
    { n:'03', t:t2('Settlement & payouts','结算与赔付'), ps:[
      t2('There is no manual oracle. When a match or stage resolves, the result is read on-chain from the WorldCupViewer (getWorldCupWinner, getGroupMatchWinners, getMatchResult).','没有人工预言机。当比赛或阶段结束时，结果从 WorldCupViewer 链上读取（getWorldCupWinner、getGroupMatchWinners、getMatchResult）。'),
      t2('Winning positions become claimable; voided markets become refundable. Every step is verifiable on BscScan.','获胜仓位变为可领取；作废市场变为可退款。每一步都可在 BscScan 上验证。'),
    ] },
    { n:'04', t:t2('Fees','费用'), ps:[
      t2('A single 1% protocol fee applies on each buy (PROTOCOL_FEE_BPS = 100), routed to the fee wallet hardcoded in the vault. There are no withdrawal or hidden fees beyond standard BSC gas.','每次买入收取单一的 1% 协议费（PROTOCOL_FEE_BPS = 100），发送到金库中硬编码的费用钱包。除标准 BSC gas 外，无提现费或隐藏费用。'),
    ] },
    { n:'05', t:t2('Flap token & vault','Flap 代币与金库'), ps:[
      t2('The betting layer plugs into the Flap ecosystem. The Flap vault is created together with the Flap token when it launches through the factory (deployed from the implementation contract). Until launch, the vault address is unset.','投注层接入 Flap 生态。Flap 金库在代币通过 factory 发行时一并创建（由 implementation 合约部署）。发行前，金库地址尚未设置。'),
    ] },
    { n:'06', t:t2('Security & trust','安全与信任'), ps:[
      t2('Non-custodial by design: funds live in the contract and every buy, sell or claim is a transaction you sign — Polyflap never holds your keys or your money.','设计上非托管：资金存于合约，每一次买入、卖出或领取都是你签名的交易 — Polyflap 从不持有你的私钥或资金。'),
      t2('Each call is dry-run with simulateContract first, so a closed or invalid market reverts before you spend gas. All contracts are public and verifiable on-chain.','每次调用先用 simulateContract 预演，因此已关闭或无效的市场会在你花费 gas 之前回滚。所有合约公开且链上可验证。'),
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
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">{t2('Polyflap is a prediction market for the 2026 World Cup, built on BNB Chain. Back a team, a match or the tournament winner with BNB — every position is a transaction you own, settled on-chain.','Polyflap 是基于 BNB 链的 2026 世界杯预测市场。用 BNB 押注球队、比赛或总冠军 — 每个仓位都是你拥有的交易，链上结算。')}</p>
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
