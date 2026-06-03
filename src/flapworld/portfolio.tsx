/* ============================================================
   FlapWorld — Portfolio / Profile
   ============================================================ */
import { useState } from 'react';
import { useT, marketTitle, teamName } from './i18n';
import { Icon, Identicon, Btn, OutcomeMark, CatTag, Countdown, useNow } from './components';
import { ALL_MARKETS, marketStatus } from './data';

/* ---------- helpers ---------- */
function pfMkt(id){ return ALL_MARKETS.find(m=>m.id===id); }
function pfOutcome(m, oid){ return m && m.outcomes.find(o=>o.id===oid); }
function pfOutcomeLabel(o, t, lang){ if(!o) return ''; if(o.kind==='team') return teamName(o.teamCode,lang); if(o.kind==='draw') return t('draw_o'); return t('others_o'); }

function posMetrics(p){
  if (p.status==='open'){ const value=p.net*(p.markFactor||1); return { value, pnl:value-p.entry }; }
  const value = p.payout||0; return { value, pnl:value-p.entry };
}
function computeStats(positions, wallet){
  let staked=0, fees=0, realized=0, unrealized=0, wins=0, losses=0, openValue=0, openCount=0;
  positions.forEach(p=>{
    staked+=p.entry; fees+=p.fee; const m=posMetrics(p);
    if (p.status==='open'){ unrealized+=m.pnl; openValue+=m.value; openCount++; }
    else { realized+=m.pnl; if(p.status==='won') wins++; if(p.status==='lost') losses++; }
  });
  const settled=wins+losses, winRate= settled? wins/settled : 0;
  const totalPnl=realized+unrealized;
  const portfolioValue=(wallet?wallet.balance:0)+openValue;
  return { staked, fees, realized, unrealized, totalPnl, wins, losses, winRate, openValue, openCount, portfolioValue, settled };
}
function rankFor(s){
  if (s.totalPnl>=4 && s.winRate>=0.55) return 'legend';
  if (s.totalPnl>=1) return 'sharp';
  if (s.totalPnl>=0) return 'contender';
  return 'rookie';
}
const pfSign = (n)=> (n>0?'+':n<0?'−':'');
const fmtPnl = (n,dp=3)=> pfSign(n)+Math.abs(n).toFixed(dp);
const pnlCls = (n)=> n>0?'text-acid':n<0?'text-down':'text-white';
function timeAgo(ts, t){
  const d=Date.now()-ts, m=Math.floor(d/60000);
  if (m<1) return t('pf_ago_now');
  if (m<60) return m+t('pf_ago_m');
  const h=Math.floor(m/60); if (h<24) return h+t('pf_ago_h');
  return Math.floor(h/24)+t('pf_ago_d');
}

/* ---------- small bits ---------- */
function CopyChip({ text, label }){
  const { t } = useT();
  const [done, setDone] = useState(false);
  return (
    <button onClick={()=>{ try{ navigator.clipboard && navigator.clipboard.writeText(text);}catch(e){} setDone(true); setTimeout(()=>setDone(false),1400); }}
      className="inline-flex items-center gap-1.5 rounded-md bg-white/6 px-2 py-1 font-mono text-[11px] text-white/60 hover:text-white hover:bg-white/10 transition">
      {done ? <span className="text-acid">✓ {t('pf_copied')}</span> : <>{label}</>}
    </button>
  );
}
function RankBadge({ rank }){
  const { t } = useT();
  const cls = { legend:'text-acid bg-acid/15 ring-acid/35', sharp:'text-acid bg-acid/10 ring-acid/25', contender:'text-cool bg-cool/12 ring-cool/25', rookie:'text-white/70 bg-white/8 ring-white/15' }[rank];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${cls}`}><Icon.bolt/>{t('pf_rank_'+rank)}</span>;
}
function WinRing({ value, size=58 }){
  const r=(size-8)/2, c=2*Math.PI*r, off=c*(1-value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#d7ff36" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} style={{ transition:'stroke-dashoffset .6s ease' }}/>
    </svg>
  );
}

/* ---------- connect empty state ---------- */
function PfConnectEmpty({ onConnect }){
  const { t } = useT();
  return (
    <main className="min-h-screen bg-ink-950 pt-16">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-acid/10 text-acid ring-1 ring-acid/25"><Icon.wallet/></span>
        <h1 className="font-display mt-7 text-4xl text-white sm:text-5xl">{t('pf_connect_h')}</h1>
        <p className="mt-3 text-white/50">{t('pf_connect_sub')}</p>
        <div className="mt-7"><Btn size="lg" variant="primary" onClick={onConnect}><Icon.wallet/> {t('connect')}</Btn></div>
      </div>
    </main>
  );
}

/* ---------- identity header ---------- */
function ProfileHeader({ wallet, stats, onDisconnect }){
  const { t } = useT();
  const rank = rankFor(stats);
  return (
    <div className="relative overflow-hidden border-b border-white/8">
      <div className="pointer-events-none absolute inset-0" style={{ background:'radial-gradient(80% 120% at 0% 0%, rgba(215,255,54,0.08), transparent 55%)' }}/>
      <div className="relative mx-auto max-w-[1320px] px-4 pt-9 pb-7 sm:px-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t('pf_kicker')}</span>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Identicon seed={wallet.address} size={64} radius={16}/>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-3xl text-white sm:text-4xl">{wallet.ens}</h1>
                <RankBadge rank={rank}/>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <CopyChip text={wallet.address} label={wallet.short}/>
                <span className="font-mono text-[11px] text-white/35">{t('pf_since')} {new Date(wallet.since).toLocaleDateString(undefined,{month:'short',year:'numeric'})}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-white/40">{t('pf_value')}</div>
              <div className="font-mono text-2xl text-white tnum">{stats.portfolioValue.toFixed(3)} <span className="text-base text-white/40">BNB</span></div>
              <div className="font-mono text-xs text-white/40 tnum">{t('balance')} {wallet.balance.toFixed(3)}</div>
            </div>
            <button onClick={onDisconnect} className="hidden rounded-xl bg-white/6 px-4 py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/10 hover:text-down hover:ring-down/40 transition sm:block">{t('pf_disconnect')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- trader card (the shareable wow) ---------- */
function TraderCard({ wallet, stats }){
  const { t } = useT();
  const rank = rankFor(stats);
  const pct = stats.staked>0 ? stats.totalPnl/stats.staked*100 : 0;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 ring-1 ring-acid/30 sm:p-7"
      style={{ boxShadow:'0 24px 70px -30px rgba(215,255,54,0.35)' }}>
      <div className="grain pointer-events-none absolute inset-0 opacity-30"/>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background:'radial-gradient(circle, rgba(215,255,54,0.22), transparent 65%)' }}/>
      <div className="font-display pointer-events-none absolute -bottom-3 right-4 text-7xl leading-none text-white/[0.04]">FW</div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Identicon seed={wallet.address} size={40} radius={11}/>
          <div>
            <div className="text-sm font-bold text-white leading-tight">{wallet.ens}</div>
            <div className="font-mono text-[11px] text-white/40">{wallet.short}</div>
          </div>
        </div>
        <RankBadge rank={rank}/>
      </div>

      <div className="relative mt-7">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{t('pf_alltime')}</div>
        <div className={`font-mono mt-1 text-5xl leading-none tnum ${pnlCls(stats.totalPnl)}`} style={{ textShadow: stats.totalPnl>0?'0 0 30px rgba(215,255,54,0.35)':'none' }}>
          {fmtPnl(stats.totalPnl,3)}
        </div>
        <div className={`font-mono mt-1.5 text-sm tnum ${pnlCls(stats.totalPnl)}`}>{pfSign(pct)}{Math.abs(pct).toFixed(1)}% · BNB</div>
      </div>

      <div className="relative mt-6 flex items-center gap-5 border-t border-white/8 pt-5">
        <div className="flex items-center gap-3">
          <WinRing value={stats.winRate}/>
          <div>
            <div className="font-mono text-lg text-white tnum">{Math.round(stats.winRate*100)}%</div>
            <div className="text-[11px] uppercase tracking-wider text-white/40">{t('pf_winrate')}</div>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-mono text-lg text-white tnum">{stats.wins}–{stats.losses}</div>
          <div className="text-[11px] uppercase tracking-wider text-white/40">{t('pf_record')}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg text-white tnum">{stats.staked.toFixed(1)}</div>
          <div className="text-[11px] uppercase tracking-wider text-white/40">{t('pf_volume')}</div>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-acid"/>BNB Chain · BSC</span>
        <CopyChip text={`flapworld.app/u/${wallet.ens}`} label={<span className="inline-flex items-center gap-1.5"><Icon.bolt/>{t('pf_share')}</span>}/>
      </div>
    </div>
  );
}

/* ---------- stat tiles ---------- */
function StatTiles({ stats }){
  const { t } = useT();
  const Tile = ({ label, value, sub, accent, big })=>(
    <div className="rounded-2xl border border-white/8 bg-ink-900 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <div className={`font-mono mt-2 tnum ${big?'text-3xl':'text-2xl'} ${accent||'text-white'}`}>{value}</div>
      {sub && <div className="mt-1 font-mono text-[11px] text-white/35 tnum">{sub}</div>}
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Tile label={t('pf_pnl')} big value={fmtPnl(stats.totalPnl,2)} accent={pnlCls(stats.totalPnl)} sub={`${t('pf_unrealized')} ${fmtPnl(stats.unrealized,2)}`}/>
      <Tile label={t('pf_value')} value={stats.portfolioValue.toFixed(2)} sub={`${t('pf_realized')} ${fmtPnl(stats.realized,2)}`}/>
      <Tile label={t('pf_winrate')} value={`${Math.round(stats.winRate*100)}%`} sub={`${stats.wins}–${stats.losses}`}/>
      <Tile label={t('pf_staked')} value={stats.staked.toFixed(2)} sub="BNB"/>
      <Tile label={t('pf_fees')} value={stats.fees.toFixed(3)} sub="BNB"/>
      <Tile label={t('pf_open_pos')} value={String(stats.openCount)} sub={`${stats.openValue.toFixed(2)} BNB`}/>
    </div>
  );
}

/* ---------- open position card ---------- */
function PositionCard({ pos, onSell, lang }){
  const { t } = useT();
  const now = useNow(1000);
  const m = pfMkt(pos.marketId); const o = pfOutcome(m, pos.outcomeId);
  const status = m ? marketStatus(m, now) : 'open';
  const { value, pnl } = posMetrics(pos);
  const [phase, setPhase] = useState('idle');
  const tradable = status==='open' || status==='soon';
  const withdraw = async ()=>{ if(phase!=='idle') return; setPhase('confirming'); try { await onSell(pos.id); } catch(e){ setPhase('idle'); } };
  if (!m || !o) return null;
  const Cell = ({ label, children })=>(<div><div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div><div className="mt-0.5 font-mono text-sm tnum">{children}</div></div>);
  return (
    <div className={`rounded-2xl border bg-ink-900 p-4 ${pos.fresh?'border-acid/40':'border-white/8'}`}>
      <div className="flex items-start gap-3">
        <OutcomeMark outcome={o} size={36}/>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="whitespace-nowrap font-bold text-white">{pfOutcomeLabel(o,t,lang)}</span>
            <span className="flex-none"><CatTag cat={m.cat}/></span>
          </div>
          <div className="truncate text-xs text-white/45">{marketTitle(m,lang)}</div>
        </div>
        <div className="flex-none text-right">
          <div className={`font-mono text-base leading-none tnum ${pnlCls(pnl)}`}>{fmtPnl(pnl,3)}</div>
          <div className="mt-1 font-mono text-[10px] text-white/40 tnum">{t('pf_value_now')} {value.toFixed(3)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 items-end gap-2 border-t border-white/8 pt-3">
        <Cell label={t('pf_entry')}><span className="text-white/85">{pos.entry.toFixed(2)}</span></Cell>
        <Cell label={t('pf_net')}><span className="text-white/85">{pos.net.toFixed(2)}</span></Cell>
        <Cell label={t('closes')}><Countdown target={m.closeTime} status={status}/></Cell>
        <div className="text-right">
          <button onClick={withdraw} disabled={!tradable || phase!=='idle'}
            className={`h-8 rounded-lg px-3 text-xs font-bold uppercase tracking-wide ring-1 transition ${tradable&&phase==='idle'?'bg-ink-800 text-white ring-white/15 hover:ring-down/60 hover:text-down':'bg-ink-800/40 text-white/30 ring-white/8 cursor-not-allowed'}`}>
            {phase==='confirming'?t('pf_withdrawing'):t('pf_withdraw')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- settled history row ---------- */
function SettledRow({ pos, lang }){
  const { t } = useT();
  const m = pfMkt(pos.marketId); const o = pfOutcome(m, pos.outcomeId);
  const { pnl } = posMetrics(pos);
  if (!m || !o) return null;
  const badge = { won:'text-acid bg-acid/12 ring-acid/25', lost:'text-down bg-down/12 ring-down/25', withdrawn:'text-white/70 bg-white/8 ring-white/15' }[pos.status];
  const badgeLabel = { won:t('pf_won'), lost:t('pf_lost'), withdrawn:t('pf_withdrawn') }[pos.status];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-ink-900 px-4 py-3">
      <OutcomeMark outcome={o} size={30}/>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="whitespace-nowrap text-sm font-bold text-white">{pfOutcomeLabel(o,t,lang)}</span>
          <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${badge}`}>{badgeLabel}</span>
        </div>
        <div className="truncate text-xs text-white/40">{marketTitle(m,lang)}</div>
      </div>
      <div className="hidden text-right sm:block"><div className="text-[10px] uppercase tracking-wider text-white/35">{t('pf_entry')}</div><div className="font-mono text-sm text-white/80 tnum">{pos.entry.toFixed(2)}</div></div>
      <div className="hidden text-right sm:block"><div className="text-[10px] uppercase tracking-wider text-white/35">{t('pf_payout')}</div><div className="font-mono text-sm text-white/80 tnum">{(pos.payout||0).toFixed(2)}</div></div>
      <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-white/35">P&L</div><div className={`font-mono text-sm tnum ${pnlCls(pnl)}`}>{fmtPnl(pnl,2)}</div></div>
    </div>
  );
}

/* ---------- activity feed ---------- */
function ActivityRow({ a, lang }){
  const { t } = useT();
  const m = a.marketId ? pfMkt(a.marketId) : null;
  const o = m ? pfOutcome(m, a.outcomeId) : null;
  const meta = { buy:{i:'+',c:'text-acid bg-acid/12'}, sell:{i:'↩',c:'text-white/70 bg-white/8'}, settle:{i: a.win?'★':'×', c:a.win?'text-acid bg-acid/12':'text-down bg-down/12'}, connect:{i:'⬡',c:'text-cool bg-cool/12'} }[a.type];
  const label = a.type==='buy'?t('act_buy'):a.type==='sell'?t('act_sell'):a.type==='settle'?(a.win?t('act_settle_won'):t('act_settle_lost')):t('act_connect');
  return (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-sm font-bold ${meta.c}`}>{meta.i}</span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="flex-none whitespace-nowrap font-semibold text-white">{label}</span>
          {o && <span className="truncate text-white/55">{pfOutcomeLabel(o,t,lang)}</span>}
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-white/35">
          <span>{timeAgo(a.ts,t)}</span>
          <span className="text-white/20">·</span>
          <a href="#" onClick={e=>e.preventDefault()} className="hover:text-acid">{a.tx}</a>
        </div>
      </div>
      {typeof a.amount==='number' && <span className="font-mono text-xs text-white/70 tnum">{a.amount.toFixed(3)}</span>}
    </div>
  );
}
function ActivityFeed({ activity, lang }){
  const { t } = useT();
  return (
    <aside className="lg:sticky lg:top-[88px]">
      <div className="rounded-2xl border border-white/8 bg-ink-900 p-4">
        <div className="mb-1 flex items-center gap-2 border-b border-white/8 pb-3">
          <span className="text-acid"><Icon.bolt/></span>
          <span className="font-display text-lg text-white">{t('pf_activity')}</span>
        </div>
        {activity.length===0
          ? <div className="py-10 text-center text-sm text-white/35">{t('pf_no_act')}</div>
          : <div className="max-h-[520px] divide-y divide-white/6 overflow-y-auto no-scrollbar">{activity.slice(0,40).map(a=><ActivityRow key={a.id} a={a} lang={lang}/>)}</div>}
      </div>
    </aside>
  );
}

/* ---------- empty block ---------- */
function PfEmpty({ title, sub, cta, onCta }){
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-white/30"><Icon.bolt/></span>
      <div className="mt-4 font-display text-xl text-white">{title}</div>
      {sub && <p className="mt-2 max-w-xs text-sm text-white/45">{sub}</p>}
      {cta && <Btn variant="outline" size="md" className="mt-5" onClick={onCta}>{cta}</Btn>}
    </div>
  );
}

/* ---------- page ---------- */
function PortfolioPage({ wallet, onConnect, onDisconnect, positions, activity, onSell, setRoute }){
  const { t, lang } = useT();
  const [tab, setTab] = useState('open');
  if (!wallet) return <PfConnectEmpty onConnect={onConnect}/>;

  const stats = computeStats(positions, wallet);
  const open = positions.filter(p=>p.status==='open');
  const settled = positions.filter(p=>p.status!=='open').sort((a,b)=>(b.settledAt||0)-(a.settledAt||0));

  return (
    <main className="min-h-screen bg-ink-950 pt-16">
      <ProfileHeader wallet={wallet} stats={stats} onDisconnect={onDisconnect}/>

      <div className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          <TraderCard wallet={wallet} stats={stats}/>
          <StatTiles stats={stats}/>
        </div>

        <div className="mt-7 grid gap-6 pb-24 lg:grid-cols-[1fr_360px]">
          <div>
            {/* sub-tabs */}
            <div className="mb-4 flex gap-1.5">
              {[['open', t('pf_open_pos'), open.length],['history', t('pf_settled'), settled.length]].map(([k,label,count])=>(
                <button key={k} onClick={()=>setTab(k)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab===k?'bg-acid text-ink-950':'bg-ink-800 text-white/70 ring-1 ring-white/8 hover:text-white'}`}>
                  {label}<span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${tab===k?'bg-ink-950/15 text-ink-950':'bg-white/8 text-white/45'}`}>{count}</span>
                </button>
              ))}
            </div>

            {tab==='open' && (
              open.length===0
                ? <PfEmpty title={t('pf_no_open')} sub={t('pf_no_open_sub')} cta={t('pf_explore')} onCta={()=>setRoute('markets')}/>
                : <div className="grid gap-3">{open.map(p=><PositionCard key={p.id} pos={p} onSell={onSell} lang={lang}/>)}</div>
            )}
            {tab==='history' && (
              settled.length===0
                ? <PfEmpty title={t('pf_no_hist')}/>
                : <div className="grid gap-2.5">{settled.map(p=><SettledRow key={p.id} pos={p} lang={lang}/>)}</div>
            )}
          </div>

          <ActivityFeed activity={activity} lang={lang}/>
        </div>
      </div>
    </main>
  );
}

export { PortfolioPage, computeStats, posMetrics, rankFor, TraderCard };
