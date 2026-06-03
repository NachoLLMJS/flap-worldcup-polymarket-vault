// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   FlapWorld — Markets (the markets floor + order ticket)
   ============================================================ */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useT, marketTitle, teamName } from './i18n';
import { Icon, BnbMark, OutcomeMark, Btn, StatusBadge, Countdown, CatTag, useNow } from './components';
import { FEE_RATE, ALL_MARKETS, MATCHES, GROUP_MARKETS, marketStatus, fmtPct, fmtMult, fmtBNB } from './data';

function useMediaQuery(q){
  const [m,setM]=useState(()=> typeof matchMedia!=='undefined' ? matchMedia(q).matches : false);
  useEffect(()=>{ const mq=matchMedia(q); const on=()=>setM(mq.matches); mq.addEventListener('change',on); return ()=>mq.removeEventListener('change',on); },[q]);
  return m;
}

/* thin implied-probability bar */
function ProbBar({ value, active }){
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-white/10">
      <span className="block h-full rounded-full transition-all duration-500"
        style={{ width:`${Math.max(3,Math.min(100,value))}%`, background: active?'#d7ff36':'rgba(215,255,54,0.5)' }}/>
    </span>
  );
}

/* ---------- a single tappable outcome ---------- */
function OutcomeButton({ market, outcome, selected, onPick, tradable, isWinner, compact, lang }){
  const { t } = useT();
  const label = outcome.kind==='team' ? teamName(outcome.teamCode, lang)
    : outcome.kind==='draw' ? t('draw_o') : t('others_o');
  const dim = !tradable && !isWinner;
  return (
    <button
      onClick={()=> tradable && onPick(market, outcome)}
      disabled={!tradable}
      aria-pressed={selected}
      className={`group/o relative overflow-hidden rounded-xl px-3 py-2.5 text-left transition-all duration-150
        ${selected ? 'bg-acid/12 ring-2 ring-acid pick-pop' : 'bg-ink-800 ring-1 ring-white/8'}
        ${tradable && !selected ? 'hover:ring-acid/45 hover:bg-ink-750 hover:-translate-y-0.5' : ''}
        ${dim ? 'opacity-45' : ''}
        ${isWinner ? 'ring-2 ring-acid bg-acid/15' : ''}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-acid`}>
      {selected && <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-acid/35 to-transparent" style={{ animation:'sweepIn .55s ease-out' }}/>}
      <div className="relative flex items-center gap-2.5">
        <OutcomeMark outcome={outcome} size={compact?22:26}/>
        <div className="min-w-0 flex-1">
          <div className={`truncate font-bold leading-tight ${compact?'text-[13px]':'text-sm'} ${selected||isWinner?'text-white':'text-white/90'}`}>{label}</div>
          {!compact && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">
            {outcome.id==='home'?t('home_o'):outcome.id==='away'?t('away_o'):outcome.id==='draw'?t('draw_o'):market.type==='group'?t('tab_groups_sub'):t('winner')}
          </div>}
        </div>
        <div className="text-right">
          <div className={`font-mono text-base leading-none tnum ${selected||isWinner?'text-acid':'text-white'}`}>{fmtPct(outcome.prob)}</div>
          <div className="mt-1 font-mono text-[10px] leading-none text-white/45 tnum">{fmtMult(outcome.mult)}</div>
        </div>
        {isWinner && <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-acid text-ink-950"><Icon.check/></span>}
      </div>
      <div className="relative mt-2.5"><ProbBar value={outcome.prob} active={selected||isWinner}/></div>
    </button>
  );
}

/* ---------- market card ---------- */
function MarketCard({ market, selection, onPick, lang }){
  const { t } = useT();
  const now = useNow(1000);
  const status = marketStatus(market, now);
  const tradable = status==='open' || status==='soon';
  const isSel = (oid)=> selection && selection.marketId===market.id && selection.outcomeId===oid;

  const head = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <CatTag cat={market.cat}/>
          {market.group && market.type==='match' && <span className="font-mono text-[10px] text-white/35">GRP {market.group}</span>}
        </div>
        <h3 className="mt-2 truncate font-display text-xl leading-tight text-white sm:text-2xl">{marketTitle(market, lang)}</h3>
      </div>
      <StatusBadge status={status} size="sm"/>
    </div>
  );

  const meta = (
    <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
      <span className="inline-flex items-center gap-1.5 text-white/45">
        <span className="text-white/35">{t('pool')}</span>
        <span className="inline-flex items-center gap-1 font-mono text-white/80"><BnbMark size={11} color="#d7ff36"/>{fmtBNB(market.poolBNB)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-white/35">{status==='open'||status==='soon'?t('closes'):t('closed_at')}</span>
        <Countdown target={market.closeTime} status={status}/>
      </span>
    </div>
  );

  // outcome layouts per type
  let body;
  if (market.type==='match'){
    body = (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {market.outcomes.map(o=>(
          <OutcomeButton key={o.id} market={market} outcome={o} selected={isSel(o.id)} onPick={onPick}
            tradable={tradable} isWinner={market.winner===o.id} lang={lang}/>
        ))}
      </div>
    );
  } else if (market.type==='group'){
    body = (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {market.outcomes.map(o=>(
          <OutcomeButton key={o.id} market={market} outcome={o} selected={isSel(o.id)} onPick={onPick}
            tradable={tradable} isWinner={market.winner===o.id} compact lang={lang}/>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="mt-4 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {market.outcomes.map((o,i)=>(
            <OutcomeButton key={o.id} market={market} outcome={o} selected={isSel(o.id)} onPick={onPick}
              tradable={tradable} isWinner={market.winner===o.id} compact lang={lang}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border bg-ink-900 p-4 transition-colors sm:p-5 ${tradable?'border-white/8 hover:border-white/15':'border-white/6'}`}>
      {head}
      {market.resolved && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-acid/10 px-3 py-2 text-xs ring-1 ring-acid/25">
          <span className="font-bold uppercase tracking-wider text-acid">{t('winner')}</span>
          <span className="text-white/80">{teamName(market.outcomes.find(o=>o.id===market.winner)?.teamCode, lang) || t('draw_o')}</span>
        </div>
      )}
      {body}
      {meta}
    </div>
  );
}

/* ---------- order ticket inner ---------- */
function TicketPanel({ market, outcome, wallet, status, onConnect, onBuy, onSell, openPosition, onClear, lang }){
  const { t } = useT();
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | confirming | bought | sold
  useEffect(()=>{ setPhase('idle'); }, [market?.id, outcome?.id]);

  const amt = parseFloat(amount) || 0;
  const fee = amt * FEE_RATE;
  const net = amt - fee;
  const estWin = outcome ? net * outcome.mult : 0;
  const profit = estWin - amt;
  const tradable = status==='open' || status==='soon';
  const insufficient = wallet && amt > wallet.balance + 1e-9;
  const valid = amt>0 && !insufficient && tradable;

  const quicks = [0.1, 0.5, 1, 5];
  const hasPosition = !!openPosition;
  const doBuy = async ()=>{
    if (!valid || phase!=='idle') return;
    setPhase('confirming');
    try {
      await onBuy({ marketId: market.marketId, teamId: outcome.oid, amount: amt, key: market.id, outcomeId: outcome.id });
      setPhase('bought'); setAmount('');
      setTimeout(()=>setPhase('idle'), 1700);
    } catch(e){ setPhase('idle'); }
  };
  const doSell = async ()=>{
    if (!hasPosition || phase!=='idle') return;
    setPhase('confirming');
    try {
      await onSell(openPosition.id);
      setPhase('sold');
      setTimeout(()=>setPhase('idle'), 1700);
    } catch(e){ setPhase('idle'); }
  };

  if (!outcome){
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-white/30"><Icon.bolt/></span>
        <div className="mt-4 font-display text-xl text-white">{t('no_pick')}</div>
        <p className="mt-2 max-w-[220px] text-sm text-white/45">{t('no_pick_sub')}</p>
      </div>
    );
  }

  const oLabel = outcome.kind==='team' ? teamName(outcome.teamCode,lang) : outcome.kind==='draw'? t('draw_o') : t('others_o');

  return (
    <div className="flex flex-col">
      {/* selection card (re-animates on change) */}
      <div key={market.id+outcome.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-acid/15 to-transparent p-4 ring-1 ring-acid/25">
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-acid/25 to-transparent" style={{ animation:'sweepIn .6s ease-out' }}/>
        <div className="flex items-center gap-3">
          <OutcomeMark outcome={outcome} size={40}/>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-xl text-white">{oLabel}</div>
            <div className="truncate text-xs text-white/55">{marketTitle(market,lang)}</div>
          </div>
          <button onClick={onClear} className="grid h-7 w-7 place-items-center rounded-full bg-white/8 text-white/50 hover:text-white"><Icon.close/></button>
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-white/10 pt-3">
          <div><div className="text-[10px] uppercase tracking-wider text-white/40">{t('pool')} %</div><div className="font-mono text-lg text-acid tnum">{fmtPct(outcome.prob)}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-white/40">{t('to_win')}</div><div className="font-mono text-lg text-white tnum">{fmtMult(outcome.mult)}</div></div>
          <div className="ml-auto"><StatusBadge status={status} size="sm"/></div>
        </div>
      </div>

      {/* not connected */}
      {!wallet ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-ink-850 p-5 text-center">
          <div className="font-display text-lg text-white">{t('connect_to_trade')}</div>
          <p className="mx-auto mt-1.5 max-w-[240px] text-sm text-white/45">{t('connect_sub')}</p>
          <div className="mt-4"><Btn variant="primary" size="md" className="w-full" onClick={onConnect}><Icon.wallet/> {t('connect')}</Btn></div>
        </div>
      ) : !tradable ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-ink-850 p-5 text-center">
          <StatusBadge status={status}/>
          <p className="mt-3 text-sm text-white/55">{status==='resolved'?t('market_resolved'):t('market_locked')}</p>
        </div>
      ) : (
        <>
          {/* amount */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/45">{t('amount')}</label>
              <span className="font-mono text-xs text-white/45">{t('balance')}: <span className="text-white/75">{wallet.balance.toFixed(3)}</span></span>
            </div>
            <div className={`mt-2 flex items-center gap-2 rounded-xl bg-ink-800 px-3.5 py-3 ring-1 transition-colors ${insufficient?'ring-down/60':'ring-white/10 focus-within:ring-acid/60'}`}>
              <BnbMark size={18} color="#d7ff36"/>
              <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))}
                inputMode="decimal" placeholder="0.00"
                className="w-full bg-transparent font-mono text-2xl text-white outline-none placeholder:text-white/25 tnum"/>
              <span className="font-mono text-sm text-white/40">BNB</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {quicks.map(q=>(
                <button key={q} onClick={()=>setAmount(String(q))}
                  className="flex-1 rounded-lg bg-white/6 py-1.5 font-mono text-xs text-white/70 hover:bg-acid/15 hover:text-acid transition">+{q}</button>
              ))}
              <button onClick={()=>setAmount(String(Math.floor(wallet.balance*1000)/1000))}
                className="flex-1 rounded-lg bg-white/6 py-1.5 font-mono text-xs font-bold text-acid hover:bg-acid/15 transition">{t('max')}</button>
            </div>
            {insufficient && <div className="mt-2 text-xs text-down">Insufficient BNB balance.</div>}
          </div>

          {/* breakdown */}
          <div className="mt-4 rounded-xl bg-ink-850 p-3.5 ring-1 ring-white/8">
            <div className="space-y-2 font-mono text-[13px]">
              <Row label={t('fee_line')} value={`-${fee.toFixed(4)}`} dim/>
              <Row label={t('net_stake')} value={net>0?net.toFixed(4):'0.0000'}/>
              <div className="my-1 border-t border-dashed border-white/10"/>
              <Row label={t('est_win')} value={estWin>0?estWin.toFixed(4):'0.0000'} accent/>
              <Row label={t('profit')} value={`${profit>0?'+':''}${profit.toFixed(4)}`} accent={profit>0} down={profit<0}/>
            </div>
            <p className="mt-3 text-[11px] leading-snug text-white/35">{t('illustrative')}</p>
          </div>

          {/* current open position on this outcome */}
          {hasPosition && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-xs ring-1 ring-white/8">
              <span className="text-white/55">{t('pf_open_pos')}</span>
              <span className="font-mono text-white/85 tnum">{openPosition.net.toFixed(3)} {t('pf_net')} BNB</span>
            </div>
          )}

          {/* actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button disabled={!valid || phase!=='idle'} onClick={doBuy}
              className={`relative h-12 overflow-hidden rounded-xl font-bold uppercase tracking-wide transition
                ${valid&&phase==='idle'?'bg-acid text-ink-950 hover:bg-acid-600 shadow-[0_6px_24px_-8px_rgba(215,255,54,0.6)]':'bg-acid/30 text-ink-950/50 cursor-not-allowed'}`}>
              {phase==='confirming'?t('buying'):phase==='bought'?<span className="inline-flex items-center gap-1.5"><Icon.check/>{t('bought')}</span>:t('buy')}
            </button>
            <button disabled={!hasPosition || phase!=='idle'} onClick={doSell}
              className={`h-12 rounded-xl font-bold uppercase tracking-wide ring-1 transition
                ${hasPosition&&phase==='idle'?'bg-ink-800 text-white ring-white/15 hover:ring-down/60 hover:text-down':'bg-ink-800/50 text-white/30 ring-white/8 cursor-not-allowed'}`}>
              {phase==='sold'?<span className="inline-flex items-center gap-1.5"><Icon.check/>{t('sold')}</span>:t('sell')}
            </button>
          </div>
          <p className="mt-2.5 text-[11px] leading-snug text-white/35">{t('sell_note')}</p>
        </>
      )}
    </div>
  );
}
function Row({ label, value, dim, accent, down }){
  return (
    <div className="flex items-center justify-between">
      <span className={`${dim?'text-white/40':'text-white/55'}`}>{label}</span>
      <span className={`tnum ${accent?'text-acid':down?'text-down':'text-white'}`}>{value} <span className="text-[10px] text-white/30">BNB</span></span>
    </div>
  );
}

/* ---------- desktop sticky panel + mobile sheet wrappers ---------- */
function DesktopTicket(props){
  const { t } = useT();
  return (
    <aside className="sticky top-[150px] hidden lg:block">
      <div className="rounded-2xl border border-white/10 bg-ink-900 p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-white/8 pb-3">
          <span className="text-acid"><Icon.bolt/></span>
          <span className="font-display text-lg text-white">{t('ticket')}</span>
        </div>
        <TicketPanel {...props}/>
      </div>
    </aside>
  );
}
function MobileTicket(props){
  const { t } = useT();
  const { outcome, status } = props;
  const [open, setOpen] = useState(false);
  useEffect(()=>{ if(outcome) setOpen(true); }, [outcome?.id, props.market?.id]);
  if (!outcome) return null;
  const oLabel = outcome.kind==='team'? teamName(outcome.teamCode,props.lang) : outcome.kind==='draw'? t('draw_o') : t('others_o');
  return (
    <div className="lg:hidden">
      {/* mini bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/95 backdrop-blur-xl p-3" style={{ paddingBottom:'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <OutcomeMark outcome={outcome} size={32}/>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">{oLabel}</div>
            <div className="truncate font-mono text-xs text-acid">{fmtPct(outcome.prob)} · {fmtMult(outcome.mult)}</div>
          </div>
          <Btn size="md" variant="primary" onClick={()=>setOpen(true)}>{t('ticket')}</Btn>
        </div>
      </div>
      {/* sheet */}
      {open && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={()=>setOpen(false)}/>
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-900 p-4"
            style={{ paddingBottom:'max(20px, env(safe-area-inset-bottom))', animation:'sheetUp .28s cubic-bezier(.2,.9,.3,1)' }}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15"/>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-xl text-white inline-flex items-center gap-2"><span className="text-acid"><Icon.bolt/></span>{t('ticket')}</span>
              <button onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white/60"><Icon.close/></button>
            </div>
            <TicketPanel {...props}/>
          </div>
          <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}

/* ---------- toolbar (tabs + search + sort) ---------- */
const TABS = [
  { k:'all', key:'tab_all' },
  { k:'matches', key:'tab_matches', sub:'tab_matches_sub' },
  { k:'groups', key:'tab_groups', sub:'tab_groups_sub' },
  { k:'tournament', key:'tab_tournament', sub:'tab_tournament_sub' },
];
function Toolbar({ tab, setTab, q, setQ, sort, setSort, counts }){
  const { t } = useT();
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-white/8 bg-ink-950/92 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {TABS.map(tb=>(
            <button key={tb.k} onClick={()=>setTab(tb.k)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${tab===tb.k?'bg-acid text-ink-950':'bg-ink-800 text-white/70 hover:text-white ring-1 ring-white/8'}`}>
              {t(tb.key)}
              <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${tab===tb.k?'bg-ink-950/15 text-ink-950':'bg-white/8 text-white/45'}`}>{counts[tb.k]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2 lg:justify-end">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-ink-800 px-3 py-2 ring-1 ring-white/8 focus-within:ring-acid/50 lg:max-w-xs">
            <span className="text-white/40"><Icon.search/></span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search_ph')}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"/>
            {q && <button onClick={()=>setQ('')} className="text-white/40 hover:text-white"><Icon.close/></button>}
          </div>
          <div className="relative">
            <select value={sort} onChange={e=>setSort(e.target.value)}
              className="appearance-none rounded-xl bg-ink-800 py-2 pl-3 pr-9 text-sm font-semibold text-white/80 ring-1 ring-white/8 outline-none focus:ring-acid/50">
              <option value="close">{t('sort_close')}</option>
              <option value="pool">{t('sort_pool')}</option>
              <option value="az">{t('sort_az')}</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40"><Icon.chevron/></span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- empty state ---------- */
function EmptyState({ onClear }){
  const { t } = useT();
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-2xl text-white/30"><Icon.search/></span>
      <div className="mt-5 font-display text-2xl text-white">{t('empty_h')}</div>
      <p className="mt-2 max-w-xs text-sm text-white/45">{t('empty_sub')}</p>
      <Btn variant="outline" size="md" className="mt-5" onClick={onClear}>{t('clear')}</Btn>
    </div>
  );
}

/* ---------- markets page ---------- */
function MarketsPage({ wallet, onConnect, onBuy, onSell, positions=[] }){
  const { t, lang } = useT();
  const now = useNow(1000);
  const [tab, setTab] = useState('matches');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('close');
  const [selection, setSelection] = useState(null); // {marketId, outcomeId}

  const counts = useMemo(()=>({
    all: ALL_MARKETS.length, matches: MATCHES.length, groups: GROUP_MARKETS.length, tournament: 1,
  }),[]);

  const filtered = useMemo(()=>{
    let list = tab==='all' ? ALL_MARKETS : ALL_MARKETS.filter(m=>m.cat===tab);
    const query = q.trim().toLowerCase();
    if (query) list = list.filter(m=> m.searchKey.includes(query) || marketTitle(m,lang).toLowerCase().includes(query));
    list = list.slice().sort((a,b)=>{
      if (sort==='pool') return b.poolBNB - a.poolBNB;
      if (sort==='az') return a.titleEn.localeCompare(b.titleEn);
      return a.closeTime - b.closeTime;
    });
    return list;
  },[tab,q,sort,lang]);

  const onPick = useCallback((market, outcome)=>{
    setSelection({ marketId:market.id, outcomeId:outcome.id });
  },[]);
  const clear = ()=> setSelection(null);

  const selMarket = selection ? ALL_MARKETS.find(m=>m.id===selection.marketId) : null;
  const selOutcome = selMarket ? selMarket.outcomes.find(o=>o.id===selection.outcomeId) : null;
  const selStatus = selMarket ? marketStatus(selMarket, now) : null;

  const openPosition = selection ? positions.find(p=> p.status==='open' && p.marketId===selection.marketId && p.outcomeId===selection.outcomeId) : null;

  const ticketProps = { market:selMarket, outcome:selOutcome, status:selStatus, wallet, onConnect,
    onBuy, onSell, openPosition, onClear:clear, lang };

  const tabSub = tab==='matches'?t('tab_matches_sub'):tab==='groups'?t('tab_groups_sub'):tab==='tournament'?t('tab_tournament_sub'):'';

  return (
    <main className="min-h-screen bg-ink-950 pt-16">
      {/* page head */}
      <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t('mk_floor')}</span>
            <h1 className="font-display mt-1 text-4xl leading-none text-white sm:text-6xl">{t('mk_title')}</h1>
          </div>
          <div className="hidden text-right sm:block">
            <div className="font-mono text-sm text-white/50">{t('showing')} <span className="text-white">{filtered.length}</span> {t('of')} {tab==='all'?counts.all:counts[tab]}</div>
            {tabSub && <div className="mt-1 text-xs uppercase tracking-wider text-white/35">{tabSub}</div>}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-[1320px] px-4 sm:px-6">
        <Toolbar tab={tab} setTab={setTab} q={q} setQ={setQ} sort={sort} setSort={setSort} counts={counts}/>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 pb-32 pt-6 sm:px-6 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* markets grid */}
          <div className={`grid gap-4 ${tab==='tournament'?'grid-cols-1':'sm:grid-cols-2'} content-start`}>
            {filtered.length===0
              ? <EmptyState onClear={()=>{ setQ(''); setTab('all'); }}/>
              : filtered.map(m=>(
                  <MarketCard key={m.id} market={m} selection={selection} onPick={onPick} lang={lang}/>
                ))}
          </div>
          {/* desktop ticket */}
          <DesktopTicket {...ticketProps}/>
        </div>
      </div>

      {/* mobile ticket */}
      <MobileTicket {...ticketProps}/>
    </main>
  );
}

export { useMediaQuery, ProbBar, OutcomeButton, MarketCard, TicketPanel, DesktopTicket, MobileTicket, Toolbar, EmptyState, MarketsPage };
