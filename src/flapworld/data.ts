// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   FlapWorld — data layer (REAL catalog + illustrative presentation)
   Markets, teamIds and marketIds come from the real on-chain catalog
   (src/data/markets.ts → 85 markets, verified live: marketCount() = 85).
   Odds / pools / statuses are illustrative & deterministic — on-chain
   pools are currently empty, so live values would render flat/zero.
   Reserved outcome ids: 49 = "Others", 50 = "Draw".
   ============================================================ */
import { marketFixtures } from '../data/markets';
import type { MarketFixture } from '../features/markets/types';

const CHAIN = { name: 'BNB Chain', short: 'BSC', id: 56, symbol: 'BNB' };
const FEE_RATE = 0.01;            // exactly 1%, charged on buy, NOT refunded on early sell
const RESERVED = { OTHERS: 49, DRAW: 50 };

/* ---- deterministic rng so numbers & states are stable across reloads ---- */
function strHash(s: string){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function mulberry(seed: number){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const round2 = (n: number)=>Math.round(n*100)/100;
const clamp = (n: number,a: number,b: number)=>Math.max(a,Math.min(b,n));
/* implied prob -> payout multiplier (pool-share model: total/outcome = 1/p) */
const multFromProb = (p: number)=> round2(clamp(100/Math.max(p,1.2), 1.04, 60));

const MIN=60e3, HOUR=60*MIN, DAY=24*HOUR;
const NOW0 = Date.now();

/* ---- team directory, derived from the real fixtures (teamId -> name/zh/flag emoji) ---- */
const TEAM_MAP: Record<number, { code:number; en:string; zh:string; flag:string }> = {};
(marketFixtures as MarketFixture[]).forEach((m) =>
  m.outcomes.forEach((o) => {
    if (!TEAM_MAP[o.teamId]) TEAM_MAP[o.teamId] = { code:o.teamId, en:o.name, zh:o.zh, flag:o.flag };
  })
);
const TEAM = (code: number) => TEAM_MAP[code] || { code, en:String(code), zh:String(code), flag:'🏳️' };

const catFromType = (type: string) => type==='Tournament Winner' ? 'tournament' : type==='Group Winner' ? 'groups' : 'matches';
const kindFromType = (type: string) => type==='Tournament Winner' ? 'tournament' : type==='Group Winner' ? 'group' : 'match';
const groupLetter = (title: string) => { const m = /Group\s+([A-L])/i.exec(title); return m ? m[1].toUpperCase() : null; };

/* ---- illustrative odds (deterministic per market) ---- */
function matchOdds(rnd: ()=>number){
  let pDraw = clamp(26 + (rnd()-0.5)*9, 14, 33);
  const remain = 100 - pDraw;
  let pHome = remain * (0.42 + rnd()*0.20);     // mild home lean
  let pAway = remain - pHome;
  const tot = pHome + pDraw + pAway;
  pHome = round2(pHome/tot*100); pDraw = round2(pDraw/tot*100); pAway = round2(100 - pHome - pDraw);
  return { pHome, pDraw, pAway };
}

/* ---- schedule: a spread of live states relative to "now" ---- */
function scheduleFor(gi: number){
  if (gi === 3 || gi === 26 || gi === 54) return { close: NOW0 - (1.6 + gi%3)*DAY, kind:'resolved' as const };
  if (gi === 7 || gi === 41)              return { close: NOW0 - (35 + gi)*MIN,    kind:'pending'  as const };
  if (gi === 12 || gi === 49)             return { close: NOW0 - 6*MIN,            kind:'closed'   as const };
  if (gi % 13 === 5)                      return { close: NOW0 + (1.4 + (gi%4))*HOUR, kind:'soon' as const };
  const day = 1.5 + (gi % 9);
  const hourOffset = (gi % 5) * 2.5;
  return { close: NOW0 + day*DAY + hourOffset*HOUR, kind:'open' as const };
}

/* ---- build one design-model market from a real fixture ---- */
function buildMarket(fix: MarketFixture, gi: number){
  const cat = catFromType(fix.type);
  const mtype = kindFromType(fix.type);
  const rnd = mulberry(strHash('mk'+fix.marketId));
  let outcomes: any[];

  if (mtype === 'match'){
    const draw = fix.outcomes.find(o=>o.teamId===RESERVED.DRAW);
    const teams = fix.outcomes.filter(o=>o.teamId!==RESERVED.DRAW);
    const home = teams[0], away = teams[1] || teams[0];
    const { pHome, pDraw, pAway } = matchOdds(rnd);
    outcomes = [
      { id:'home', kind:'team', teamCode:home.teamId, oid:home.teamId, prob:pHome, mult:multFromProb(pHome) },
      { id:'draw', kind:'draw', teamCode:null,        oid:(draw?draw.teamId:RESERVED.DRAW), prob:pDraw, mult:multFromProb(pDraw) },
      { id:'away', kind:'team', teamCode:away.teamId, oid:away.teamId, prob:pAway, mult:multFromProb(pAway) },
    ];
  } else {
    const outs = fix.outcomes;
    const weights = outs.map((o)=> (o.teamId===RESERVED.OTHERS ? 0.5 : 1) * Math.pow(0.6 + rnd(), 2.2));
    const wTot = weights.reduce((a,b)=>a+b,0) || 1;
    outcomes = outs.map((o,i)=>{
      const prob = round2(weights[i]/wTot*100);
      const isOthers = o.teamId===RESERVED.OTHERS;
      return { id:String(o.teamId), kind:isOthers?'others':'team', teamCode:o.teamId, oid:o.teamId, prob, mult:multFromProb(prob) };
    });
    // fix rounding drift on the favourite
    outcomes.sort((a,b)=>b.prob-a.prob);
    const drift = round2(100 - outcomes.reduce((a,o)=>a+o.prob,0));
    if (outcomes[0]){ outcomes[0].prob = round2(outcomes[0].prob + drift); outcomes[0].mult = multFromProb(outcomes[0].prob); }
  }

  const sched = mtype==='match' ? scheduleFor(gi) : { close: NOW0 + (3 + gi*0.4)*DAY, kind:'open' as const };
  const resolved = sched.kind==='resolved';
  let winner: string | null = null;
  if (resolved) winner = outcomes.slice().sort((a,b)=>b.prob-a.prob)[0].id;

  return {
    id: `m${fix.marketId}`,
    marketId: fix.marketId,
    viewerMatchId: fix.viewerMatchId,
    type: mtype,
    cat,
    group: mtype==='group' ? groupLetter(fix.title) : null,
    titleEn: fix.title,
    titleZh: fix.zhTitle,
    teams: fix.outcomes.filter(o=>o.teamId!==RESERVED.DRAW && o.teamId!==RESERVED.OTHERS).map(o=>o.teamId),
    searchKey: [fix.title, fix.zhTitle, ...fix.outcomes.flatMap(o=>[o.name, o.zh])].join(' ').toLowerCase(),
    closeTime: sched.close,
    baseKind: sched.kind,
    poolBNB: round2(30 + rnd()*880),
    outcomes,
    resolved,
    winner,
  };
}

const ALL_MARKETS = (marketFixtures as MarketFixture[]).map((fix, i) => buildMarket(fix, i));
const MATCHES = ALL_MARKETS.filter(m=>m.type==='match');
const GROUP_MARKETS = ALL_MARKETS.filter(m=>m.type==='group');
const TOURNAMENT_MARKET = ALL_MARKETS.find(m=>m.type==='tournament') || ALL_MARKETS[0];

/* ---- live status: re-evaluated against the current clock ---- */
function marketStatus(m: any, now: number){
  if (m.resolved) return 'resolved';
  const delta = m.closeTime - now;
  if (delta <= 0) return (now - m.closeTime) < 2.2*HOUR ? 'closed' : 'pending';
  if (delta <= 6*HOUR) return 'soon';
  return 'open';
}

/* ---- formatting ---- */
const fmtBNB = (n: number)=> (n>=1000 ? (n/1000).toFixed(n>=10000?0:2).replace(/\.00$/,'')+'k' : (n>=100? String(Math.round(n)): n.toFixed(2).replace(/\.?0+$/,'')));
const fmtPct = (n: number)=> `${Math.round(n)}%`;
const fmtMult = (n: number)=> `${n.toFixed(2)}×`;

export {
  CHAIN, FEE_RATE, RESERVED, TEAM, TEAM_MAP,
  MATCHES, GROUP_MARKETS, TOURNAMENT_MARKET, ALL_MARKETS,
  marketStatus, fmtBNB, fmtPct, fmtMult, multFromProb, round2, clamp,
  NOW0, MIN, HOUR, DAY,
};
