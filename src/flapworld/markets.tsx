// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap — Markets (the markets floor + order ticket)
   Markets show real teams/titles only — no simulated odds, pools,
   statuses or winners. Outcomes are selectable; the real payout is
   set by the on-chain pool at close (placeBet simulates first, so a
   non-open market reverts before signing).
   ============================================================ */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPublicClient, formatEther, http, parseAbi } from 'viem';
import { bsc } from 'viem/chains';
import { useT, marketTitle, teamName } from './i18n';
import { Icon, BnbMark, OutcomeMark, Btn, CatTag } from './components';
import { FEE_RATE, ALL_MARKETS } from './data';
import { bettingAbi } from './abi';
import { BETTING_VAULT_ADDRESS, BSC_RPC_URL, WORLD_CUP_VIEWER_ADDRESS } from '../lib/env';

const STATUS_NAMES = ['Draft','Open','Locked','Resolved','Cancelled'];
const viewerAbi = parseAbi([
  'function getWorldCupWinner() view returns ((uint256 matchId,string matchName,bool isResolved,uint256 teamId,string teamName))',
  'function getGroupMatchWinners(uint256 matchId) view returns ((uint256 matchId,string matchName,bool isResolved,uint256 teamId,string teamName))',
  'function getMatchResult(uint256 matchId) view returns ((uint256 matchId,string matchName,bool isResolved,uint256 teamId,string teamName))',
]);
const readClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC_URL || 'https://bsc-dataseed.binance.org') });
const viewerAddress = WORLD_CUP_VIEWER_ADDRESS || '0x00036192958C2aaAF9F445d3Cdc2979995EA333e';
const isOpenForBetting = (s)=> s && s.statusName === 'Open' && Math.floor(Date.now()/1000) < s.closeTime;
const canResolveState = (s)=> s && (s.statusName === 'Locked' || (s.statusName === 'Open' && Math.floor(Date.now()/1000) >= s.closeTime)) && Math.floor(Date.now()/1000) >= s.resolveAfter && s.viewerResolved && !s.resolved;
function fmtDuration(ms){
  const s = Math.max(0, Math.ceil(ms/1000));
  const m = Math.floor(s/60);
  const r = String(s%60).padStart(2,'0');
  return `${m}:${r}`;
}
function viewerCallFor(m){
  if (m.type === 'tournament') return { address: viewerAddress, abi: viewerAbi, functionName: 'getWorldCupWinner' };
  if (m.type === 'group') return { address: viewerAddress, abi: viewerAbi, functionName: 'getGroupMatchWinners', args: [BigInt(m.viewerMatchId)] };
  return { address: viewerAddress, abi: viewerAbi, functionName: 'getMatchResult', args: [BigInt(m.viewerMatchId)] };
}
function useOnchainMarketStates(wallet){
  const [states, setStates] = useState({});
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async ()=>{
    if (!BETTING_VAULT_ADDRESS) { setLoaded(true); return; }
    try {
      const marketCalls = ALL_MARKETS.map(m=>({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'getMarket', args:[BigInt(m.marketId)] }));
      const viewerCalls = ALL_MARKETS.map(viewerCallFor);
      const [marketResults, viewerResults, latestBlock] = await Promise.all([
        readClient.multicall({ contracts: marketCalls, allowFailure: true }),
        readClient.multicall({ contracts: viewerCalls, allowFailure: true }),
        readClient.getBlock(),
      ]);
      const chainNow = Number(latestBlock.timestamp);
      let claimResults = [];
      if (wallet?.address) {
        claimResults = await readClient.multicall({
          contracts: ALL_MARKETS.map(m=>({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'claimable', args:[BigInt(m.marketId), wallet.address] })),
          allowFailure: true,
        });
      }
      const next = {};
      ALL_MARKETS.forEach((m, i)=>{
        const mr = marketResults[i];
        const vr = viewerResults[i];
        if (mr.status !== 'success') {
          next[m.id] = {
            missing: true,
            statusName: 'Not seeded yet',
            resolved: false,
            cancelled: false,
            closeTime: Math.floor(m.closeTime / 1000),
            resolveAfter: Math.floor(m.closeTime / 1000),
            totalPool: 0,
            outcomePools: [],
            outcomeTeamIds: [],
            viewerResolved: false,
            viewerTeamId: 0,
            viewerTeamName: '',
            viewerMatchName: '',
            closedByTime: false,
            claimableWei: '0',
            claimableBnb: 0,
          };
          return;
        }
        const view = mr.result?.view_ || mr.result?.[0] || mr.result;
        const { market, outcomeTeamIds, outcomePools } = view;
        const v = vr.status === 'success' ? vr.result : null;
        const claimableWei = claimResults[i]?.status === 'success' ? claimResults[i].result : 0n;
        const status = Number(market.status);
        const closeTime = Number(market.closeTime);
        const resolveAfter = Number(market.resolveAfter);
        next[m.id] = {
          status,
          statusName: STATUS_NAMES[status] || String(status),
          openTime: Number(market.openTime),
          closeTime,
          resolveAfter,
          resolved: status === 3,
          cancelled: status === 4,
          winningTeamId: Number(market.winningTeamId),
          totalPool: Number(formatEther(market.totalPool || 0n)),
          outcomePools: (outcomePools || []).map(x=>x?.toString?.() ?? String(x)),
          outcomeTeamIds: (outcomeTeamIds || []).map(x=>Number(x)),
          viewerResolved: !!v?.isResolved,
          viewerTeamId: v ? Number(v.teamId) : 0,
          viewerTeamName: v?.teamName || '',
          viewerMatchName: v?.matchName || '',
          closedByTime: chainNow >= closeTime,
          claimableWei: claimableWei.toString(),
          claimableBnb: Number(formatEther(claimableWei || 0n)),
        };
      });
      setStates(next);
      setLoaded(true);
    } catch (err) {
      console.warn('[Polyflap] market state refresh failed; keeping current on-chain market list', err);
      setLoaded(true);
    }
  },[wallet?.address]);
  useEffect(()=>{ refresh(); const id = setInterval(refresh, 30000); return ()=>clearInterval(id); }, [refresh]);
  return { states, loaded, refresh };
}

/* ---------- a single tappable outcome ---------- */
function OutcomeButton({ market, outcome, selected, onPick, compact, lang, disabled }){
  const { t } = useT();
  const label = outcome.kind==='team' ? teamName(outcome.teamCode, lang)
    : outcome.kind==='draw' ? t('draw_o') : t('others_o');
  const sub = outcome.id==='home' ? t('home_o')
    : outcome.id==='away' ? t('away_o')
    : outcome.id==='draw' ? t('draw_o')
    : market.type==='group' ? t('tab_groups_sub') : t('winner');
  return (
    <button
      onClick={()=> !disabled && onPick(market, outcome)}
      disabled={disabled}
      aria-pressed={selected}
      className={`group/o relative overflow-hidden rounded-xl px-3 py-2.5 text-left transition-all duration-150
        ${selected ? 'bg-acid/12 ring-2 ring-acid pick-pop' : disabled ? 'bg-ink-800/45 ring-1 ring-white/5 opacity-45 cursor-not-allowed' : 'bg-ink-800 ring-1 ring-white/8 hover:ring-acid/45 hover:bg-ink-750 hover:-translate-y-0.5'}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-acid`}>
      {selected && <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-acid/35 to-transparent" style={{ animation:'sweepIn .55s ease-out' }}/>}
      <div className="relative flex items-center gap-2.5">
        <OutcomeMark outcome={outcome} size={compact?22:26}/>
        <div className="min-w-0 flex-1">
          <div className={`truncate font-bold leading-tight ${compact?'text-[13px]':'text-sm'} ${selected?'text-white':'text-white/90'}`}>{label}</div>
          {!compact && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">{sub}</div>}
        </div>
      </div>
    </button>
  );
}

/* ---------- market card (teams + title only) ---------- */
function MarketCard({ market, selection, onPick, lang, state, wallet, onConnect, onResolve, onClaim, onRefresh }){
  // Do not lock the UI while BSC state is still loading or an RPC call fails.
  // Unknown state should remain browsable/selectable; only a confirmed closed/resolved
  // on-chain state disables outcomes.
  const [phase, setPhase] = useState('idle');
  const blocked = state ? !isOpenForBetting(state) : false;
  const canResolve = canResolveState(state);
  const hasClaim = !!state && state.claimableBnb > 0;
  const awaitingResult = state && blocked && !state.resolved && !state.cancelled && state.closedByTime && !state.viewerResolved;
  const isSel = (oid)=> selection && selection.marketId===market.id && selection.outcomeId===oid;
  const statusLabel = state ? state.resolved ? `Resolved: ${state.viewerTeamName || teamName(state.winningTeamId, lang)}` : state.viewerResolved && state.closedByTime ? `Ready to resolve: ${state.viewerTeamName}` : state.closedByTime ? 'Closed' : state.statusName : 'Loading chain state';
  const doResolve = async ()=>{
    if (!canResolve || phase!=='idle') return;
    if (!wallet) { onConnect?.(); return; }
    setPhase('confirming');
    try {
      await onResolve?.(market.marketId);
      await onRefresh?.();
    } finally {
      setPhase('idle');
    }
  };
  const doClaim = async ()=>{
    if (!hasClaim || phase!=='idle') return;
    if (!wallet) { onConnect?.(); return; }
    setPhase('confirming');
    try {
      await onClaim?.(market.marketId);
      await onRefresh?.();
    } finally {
      setPhase('idle');
    }
  };
  const head = (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <CatTag cat={market.cat}/>
        {market.group && market.type==='match' && <span className="font-mono text-[10px] text-white/35">GRP {market.group}</span>}
      </div>
      <h3 className="mt-2 truncate font-display text-xl leading-tight text-white sm:text-2xl">{marketTitle(market, lang)}</h3>
      <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${blocked?'bg-white/8 text-white/50':'bg-acid/15 text-acid'}`}>{statusLabel}</div>
    </div>
  );

  let body;
  if (market.type==='match'){
    body = (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {market.outcomes.map(o=>(
          <OutcomeButton key={o.id} market={market} outcome={o} selected={isSel(o.id)} onPick={onPick} disabled={blocked} lang={lang}/>
        ))}
      </div>
    );
  } else if (market.type==='group'){
    body = (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {market.outcomes.map(o=>(
          <OutcomeButton key={o.id} market={market} outcome={o} selected={isSel(o.id)} onPick={onPick} disabled={blocked} compact lang={lang}/>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="mt-4 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {market.outcomes.map((o)=>(
            <OutcomeButton key={o.id} market={market} outcome={o} selected={isSel(o.id)} onPick={onPick} disabled={blocked} compact lang={lang}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-900 p-4 transition-colors hover:border-white/15 sm:p-5">
      {head}
      {canResolve && (
        <div className="mt-4 rounded-xl border border-acid/25 bg-acid/10 p-3">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Result ready</div>
          <div className="mt-1 text-sm text-white/75">WorldCupViewer result: <span className="font-bold text-white">{state.viewerTeamName || state.viewerTeamId}</span></div>
          <button
            onClick={doResolve}
            disabled={phase!=='idle'}
            className="mt-3 h-10 w-full rounded-xl bg-acid font-bold uppercase tracking-wide text-ink-950 transition hover:bg-acid-600 disabled:cursor-not-allowed disabled:bg-acid/35 disabled:text-ink-950/45">
            {phase==='confirming' ? 'Confirming…' : wallet ? 'Resolve market' : 'Connect to resolve'}
          </button>
        </div>
      )}
      {hasClaim && (
        <div className="mt-4 rounded-xl border border-acid/30 bg-acid/12 p-3">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Winning position</div>
          <div className="mt-1 text-sm text-white/75">Claimable payout: <span className="font-mono font-bold text-white">{state.claimableBnb.toFixed(8)} BNB</span></div>
          <button
            onClick={doClaim}
            disabled={phase!=='idle'}
            className="mt-3 h-10 w-full rounded-xl bg-acid font-bold uppercase tracking-wide text-ink-950 transition hover:bg-acid-600 disabled:cursor-not-allowed disabled:bg-acid/35 disabled:text-ink-950/45">
            {phase==='confirming' ? 'Confirming…' : 'Claim winnings'}
          </button>
        </div>
      )}
      {awaitingResult && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/55">
          Betting is closed. Waiting for the official WorldCupViewer result.
        </div>
      )}
      {body}
    </div>
  );
}

/* ---------- order ticket inner ---------- */
function TicketPanel({ market, outcome, wallet, onConnect, onBuy, onSell, onClaim, onResolve, onRefresh, marketState, openPosition, onClear, lang }){
  const { t } = useT();
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | confirming | bought | sold
  const [chainNowMs, setChainNowMs] = useState(Date.now());
  useEffect(()=>{ setPhase('idle'); }, [market?.id, outcome?.id]);
  useEffect(()=>{
    let cancelled = false;
    const sync = async ()=>{
      if (!openPosition?.withdrawUnlockTimestamp) return;
      try {
        const block = await readClient.getBlock({ blockTag: 'latest' });
        if (!cancelled) setChainNowMs(Number(block.timestamp) * 1000);
      } catch { if (!cancelled) setChainNowMs(Date.now()); }
    };
    sync();
    const id = window.setInterval(sync, 15000);
    return ()=>{ cancelled = true; window.clearInterval(id); };
  }, [openPosition?.withdrawUnlockTimestamp]);

  const amt = parseFloat(amount) || 0;
  const fee = amt * FEE_RATE;
  const net = amt - fee;
  const marketOpen = isOpenForBetting(marketState);
  const canResolve = canResolveState(marketState);
  const hasClaim = !!marketState && marketState.claimableBnb > 0;
  const insufficient = wallet && amt > wallet.balance + 1e-9;
  const quicks = [0.1, 0.5, 1, 5];
  const hasPosition = !!openPosition;
  const cooldownRemainingMs = openPosition?.withdrawUnlockTimestamp ? (openPosition.withdrawUnlockTimestamp * 1000 - chainNowMs) : 0;
  const cooldownActive = !!(openPosition?.onChain && cooldownRemainingMs > 0);
  const canSell = hasPosition && !cooldownActive && phase==='idle';
  const valid = marketOpen && amt>0 && !insufficient && !hasPosition;

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
    if (!canSell) return;
    setPhase('confirming');
    try {
      await onSell(openPosition.id);
      setPhase('sold');
      setTimeout(()=>setPhase('idle'), 1700);
    } catch(e){ setPhase('idle'); }
  };
  const doResolve = async ()=>{
    if (!canResolve || phase!=='idle') return;
    setPhase('confirming');
    try { await onResolve(market.marketId); await onRefresh?.(); setPhase('idle'); } catch(e){ setPhase('idle'); }
  };
  const doClaim = async ()=>{
    if (!hasClaim || phase!=='idle') return;
    setPhase('confirming');
    try { await onClaim(market.marketId); await onRefresh?.(); setPhase('idle'); } catch(e){ setPhase('idle'); }
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
      {/* selection card */}
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
      </div>

      {marketState && !marketOpen && (
        <div className="mt-4 rounded-2xl border border-white/8 bg-ink-850 p-4 text-sm text-white/65">
          <div className="font-bold text-white">{marketState.resolved ? 'Market resolved' : marketState.closedByTime ? 'Betting closed' : marketState.statusName}</div>
          {marketState.viewerResolved && <div className="mt-1">WorldCupViewer result: <span className="text-acid">{marketState.viewerTeamName || marketState.viewerTeamId}</span></div>}
          {canResolve && <button onClick={doResolve} disabled={phase!=='idle'} className="mt-3 h-10 w-full rounded-xl bg-white/8 font-bold text-white ring-1 ring-white/12 hover:ring-acid/50">{phase==='confirming'?'Confirming…':'Resolve market'}</button>}
          {hasClaim && <button onClick={doClaim} disabled={phase!=='idle'} className="mt-3 h-10 w-full rounded-xl bg-acid font-bold text-ink-950">{phase==='confirming'?'Confirming…':`Claim ${marketState.claimableBnb.toFixed(4)} BNB`}</button>}
        </div>
      )}

      {!wallet ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-ink-850 p-5 text-center">
          <div className="font-display text-lg text-white">{t('connect_to_trade')}</div>
          <p className="mx-auto mt-1.5 max-w-[240px] text-sm text-white/45">{t('connect_sub')}</p>
          <div className="mt-4"><Btn variant="primary" size="md" className="w-full" onClick={onConnect}><Icon.wallet/> {t('connect')}</Btn></div>
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

          {/* breakdown: fee + net only (no simulated odds/payout) */}
          <div className="mt-4 rounded-xl bg-ink-850 p-3.5 ring-1 ring-white/8">
            <div className="space-y-2 font-mono text-[13px]">
              <Row label={t('fee_line')} value={`-${fee.toFixed(4)}`} dim/>
              <Row label={t('net_stake')} value={net>0?net.toFixed(4):'0.0000'} accent/>
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
            <button disabled={!canSell} onClick={doSell}
              title={cooldownActive ? `Verified on-chain cooldown: withdraw unlocks in ${fmtDuration(cooldownRemainingMs)}` : undefined}
              className={`h-12 rounded-xl font-bold uppercase tracking-wide ring-1 transition
                ${canSell?'bg-ink-800 text-white ring-white/15 hover:ring-down/60 hover:text-down':'bg-ink-800/50 text-white/30 ring-white/8 cursor-not-allowed'}`}>
              {phase==='sold'?<span className="inline-flex items-center gap-1.5"><Icon.check/>{t('sold')}</span>:cooldownActive?`${t('sell')} ${fmtDuration(cooldownRemainingMs)}`:t('sell')}
            </button>
          </div>
          <p className="mt-2.5 text-[11px] leading-snug text-white/35">{t('sell_note')}</p>
        </>
      )}
    </div>
  );
}
function Row({ label, value, dim, accent }){
  return (
    <div className="flex items-center justify-between">
      <span className={`${dim?'text-white/40':'text-white/55'}`}>{label}</span>
      <span className={`tnum ${accent?'text-acid':'text-white'}`}>{value} <span className="text-[10px] text-white/30">BNB</span></span>
    </div>
  );
}

/* ---------- desktop sticky panel + mobile sheet ---------- */
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
  const { outcome } = props;
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
            <div className="truncate text-xs text-white/45">{marketTitle(props.market,props.lang)}</div>
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

/* ---------- toolbar (tabs + search) ---------- */
const TABS = [
  { k:'groups', key:'tab_groups' },
  { k:'tournament', key:'tab_tournament' },
  { k:'matches', key:'tab_matches' },
];
function Toolbar({ tab, setTab, q, setQ, counts }){
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
function MarketsPage({ wallet, onConnect, onBuy, onSell, onClaim, onResolve, positions=[] }){
  const { t, lang } = useT();
  const [tab, setTab] = useState('groups');
  const [q, setQ] = useState('');
  const [selection, setSelection] = useState(null); // {marketId, outcomeId}
  const { states: marketStates, loaded: marketsLoaded, refresh: refreshMarketStates } = useOnchainMarketStates(wallet);

  const visibleMarkets = useMemo(()=>{
    // Always show the real World Cup catalog. On-chain state controls whether a
    // card is tradable, but missing/draft RPC state must not hide all markets.
    return ALL_MARKETS;
  },[]);

  const counts = useMemo(()=>({
    matches: visibleMarkets.filter(m=>m.cat==='matches').length,
    groups: visibleMarkets.filter(m=>m.cat==='groups').length,
    tournament: visibleMarkets.filter(m=>m.cat==='tournament').length,
  }),[visibleMarkets]);

  const filtered = useMemo(()=>{
    let list = visibleMarkets.filter(m=>m.cat===tab);
    const query = q.trim().toLowerCase();
    if (query) list = list.filter(m=> m.searchKey.includes(query) || marketTitle(m,lang).toLowerCase().includes(query));
    const rank = (m)=>{
      const s = marketStates[m.id];
      if (!s) return 1; // loading/unknown: keep near the top but after confirmed tradable
      if (isOpenForBetting(s)) return 0; // active betting markets first
      if (s.statusName === 'Draft' || s.missing) return 2;
      if (s.statusName === 'Locked') return 3;
      if (s.resolved) return 4;
      if (s.cancelled) return 5;
      return 6;
    };
    const closeOf = (m)=> marketStates[m.id]?.closeTime ?? Math.floor(m.closeTime/1000);
    return list.slice().sort((a,b)=>{
      const ar = rank(a), br = rank(b);
      if (ar !== br) return ar - br;
      const at = closeOf(a), bt = closeOf(b);
      if (at !== bt) return at - bt;
      return a.titleEn.localeCompare(b.titleEn);
    });
  },[tab,q,lang,marketStates,visibleMarkets]);

  const onPick = useCallback((market, outcome)=>{
    const s = marketStates[market.id];
    if (s && !isOpenForBetting(s)) return;
    setSelection({ marketId:market.id, outcomeId:outcome.id });
  },[marketStates]);
  const clear = ()=> setSelection(null);

  const selMarket = selection ? ALL_MARKETS.find(m=>m.id===selection.marketId) : null;
  const selOutcome = selMarket ? selMarket.outcomes.find(o=>o.id===selection.outcomeId) : null;
  const selState = selMarket ? marketStates[selMarket.id] : null;
  const openPosition = selection ? positions.find(p=> p.status==='open' && p.marketId===selection.marketId && p.outcomeId===selection.outcomeId) : null;

  const ticketProps = { market:selMarket, outcome:selOutcome, wallet, onConnect, onBuy, onSell, onClaim, onResolve, onRefresh:refreshMarketStates, marketState:selState, openPosition, onClear:clear, lang };
  const tabSub = tab==='matches'?t('tab_matches_sub'):tab==='groups'?t('tab_groups_sub'):tab==='tournament'?t('tab_tournament_sub'):'';

  return (
    <main className="min-h-screen bg-ink-950 pt-20">
      {/* page head */}
      <div className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acid">{t('mk_floor')}</span>
            <h1 className="font-display mt-1 text-4xl leading-none text-white sm:text-6xl">{t('mk_title')}</h1>
          </div>
          <div className="hidden text-right sm:block">
            <div className="font-mono text-sm text-white/50">{t('showing')} <span className="text-white">{filtered.length}</span> {t('of')} {counts[tab] || 0}</div>
            {tabSub && <div className="mt-1 text-xs uppercase tracking-wider text-white/35">{tabSub}</div>}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-[1320px] px-4 sm:px-6">
        <Toolbar tab={tab} setTab={setTab} q={q} setQ={setQ} counts={counts}/>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 pb-32 pt-6 sm:px-6 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* markets grid */}
          <div className={`grid gap-4 ${tab==='tournament'?'grid-cols-1':'sm:grid-cols-2'} content-start`}>
            {filtered.length===0
              ? <EmptyState onClear={()=>{ setQ(''); setTab('groups'); }}/>
              : filtered.map(m=>(
                  <MarketCard key={m.id} market={m} state={marketStates[m.id]} selection={selection} onPick={onPick} lang={lang} wallet={wallet} onConnect={onConnect} onResolve={onResolve} onClaim={onClaim} onRefresh={refreshMarketStates}/>
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

export { OutcomeButton, MarketCard, TicketPanel, DesktopTicket, MobileTicket, Toolbar, EmptyState, MarketsPage };
