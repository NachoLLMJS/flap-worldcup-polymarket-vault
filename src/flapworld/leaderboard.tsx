// @ts-nocheck -- on-chain leaderboard readback normalizes viem tuples at runtime
import React, { useCallback, useEffect, useState } from 'react';
import { createPublicClient, formatEther, http } from 'viem';
import { bsc } from 'viem/chains';
import { BETTING_VAULT_ADDRESS, BSC_RPC_URL } from '../lib/env';
import { ALL_MARKETS, TEAM } from './data';
import { useT, marketTitle, teamName } from './i18n';
import { bettingAbi } from './abi';
import { Btn, FlagChip, Icon } from './components';

const ZERO = '0x0000000000000000000000000000000000000000';
const readClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC_URL || 'https://bsc-dataseed.binance.org') });

function shortAddr(a){ return a ? `${a.slice(0,6)}…${a.slice(-4)}` : '—'; }
function fmtBnb(v){
  const n = Number(formatEther(v || 0n));
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1000) return `${(n/1000).toFixed(2)}k`;
  if (n >= 10) return n.toFixed(3).replace(/\.?0+$/,'');
  return n.toFixed(6).replace(/\.?0+$/,'');
}
function fmtTime(ts){
  const n = Number(ts || 0n);
  if (!n) return '—';
  return new Date(n*1000).toLocaleString([], { month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}
function marketById(id){ return ALL_MARKETS.find(m=>Number(m.marketId)===Number(id)); }
function outcomeLabel(teamId, lang){
  const id = Number(teamId);
  if (id === 50) return 'Draw';
  if (id === 49) return 'Others';
  return teamName(id, lang) || TEAM(id)?.en || String(id);
}
function outcomeFlag(teamId){
  const id = Number(teamId);
  return id > 0 && id < 49 ? <FlagChip code={id} size={22}/> : <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[10px] text-white/60">{id===50?'X':'+'}</span>;
}
function parseTuple(t){
  const wallets = t.wallets || t[0] || [];
  const wagered = t.wagered || t[1] || [];
  const activeBets = t.activeBets || t[2] || [];
  const lastMarketIds = t.lastMarketIds || t[3] || [];
  const lastTeamIds = t.lastTeamIds || t[4] || [];
  const lastTimestamps = t.lastTimestamps || t[5] || [];
  return { wallets, wagered, activeBets, lastMarketIds, lastTeamIds, lastTimestamps };
}
function parseEpochTuple(t){
  const wallets = t.wallets || t[0] || [];
  const wagered = t.wagered || t[1] || [];
  const bonusBps = t.bonusBps || t[2] || [];
  const weightedWagers = t.weightedWagers || t[3] || [];
  return { wallets, wagered, bonusBps, weightedWagers };
}

function buildRows(top, epochTop, lang){
  const eByWallet = new Map();
  epochTop.wallets.forEach((w,i)=>{ if (w && w !== ZERO) eByWallet.set(w.toLowerCase(), { epochWagered:epochTop.wagered[i]||0n, bonusBps:Number(epochTop.bonusBps[i]||0n), weightedWager:epochTop.weightedWagers[i]||0n }); });
  return top.wallets.map((wallet,i)=>{
    if (!wallet || wallet === ZERO || (top.wagered[i]||0n) === 0n) return null;
    const marketId = Number(top.lastMarketIds[i] || 0n);
    const teamId = Number(top.lastTeamIds[i] || 0n);
    const m = marketById(marketId);
    const epoch = eByWallet.get(wallet.toLowerCase()) || { epochWagered:0n, bonusBps:0, weightedWager:0n };
    return {
      rank:i+1,
      address:wallet,
      total:top.wagered[i] || 0n,
      activeBets:Number(top.activeBets[i] || 0n),
      lastMarketId:marketId,
      lastTeamId:teamId,
      lastTimestamp:top.lastTimestamps[i] || 0n,
      lastMarketTitle:m ? marketTitle(m, lang) : (marketId ? `Market ${marketId}` : '—'),
      lastOutcome:teamId ? outcomeLabel(teamId, lang) : '—',
      epochWagered:epoch.epochWagered,
      bonusBps:epoch.bonusBps,
      weightedWager:epoch.weightedWager,
    };
  }).filter(Boolean).sort((a,b)=> Number(b.total-a.total));
}

function Stat({ label, value, sub }){
  return <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{label}</div>
    <div className="font-display mt-2 text-3xl text-white">{value}</div>
    {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
  </div>;
}
function Row({ row, idx }){
  const medal = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':String(idx+1).padStart(2,'0');
  return <div className="grid gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-4 lg:grid-cols-[64px_1fr_130px_110px_130px] lg:items-center">
    <div className="font-display text-2xl text-acid">{medal}</div>
    <div className="min-w-0">
      <a href={`https://bscscan.com/address/${row.address}`} target="_blank" rel="noreferrer" className="font-mono text-sm text-white hover:text-acid">{shortAddr(row.address)}</a>
      <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-white/45">
        {outcomeFlag(row.lastTeamId)}
        <span className="truncate">Last: {row.lastOutcome} · {row.lastMarketTitle}</span>
      </div>
      <div className="mt-1 text-[10px] text-white/30">{fmtTime(row.lastTimestamp)}</div>
    </div>
    <div><div className="text-[10px] uppercase tracking-wider text-white/35">Total wagered</div><div className="font-mono text-lg text-white tnum">{fmtBnb(row.total)}</div></div>
    <div><div className="text-[10px] uppercase tracking-wider text-white/35">Active bets</div><div className="font-mono text-lg text-acid tnum">{row.activeBets}</div></div>
    <div><div className="text-[10px] uppercase tracking-wider text-white/35">Epoch weighted</div><div className="font-mono text-lg text-white tnum">{fmtBnb(row.weightedWager)}</div>{row.bonusBps>0 && <div className="text-[10px] text-acid">+{row.bonusBps/100}% boost</div>}</div>
  </div>;
}
function Skeleton(){ return <div className="grid gap-4 md:grid-cols-4">{[0,1,2,3].map(i=><div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/8"/> )}</div>; }

function LeaderboardPage({ setRoute }){
  const { lang } = useT();
  const [state, setState] = useState({ loading:true, error:null, rows:[], epoch:null, block:null });
  const load = useCallback(async()=>{
    if (!BETTING_VAULT_ADDRESS || BETTING_VAULT_ADDRESS === ZERO) { setState({ loading:false, error:'Betting vault is not configured.', rows:[], epoch:null, block:null }); return; }
    setState(s=>({ ...s, loading:true, error:null }));
    try {
      const [block, top, currentEpoch] = await Promise.all([
        readClient.getBlock(),
        readClient.readContract({ address:BETTING_VAULT_ADDRESS, abi:bettingAbi, functionName:'getTopBettors' }),
        readClient.readContract({ address:BETTING_VAULT_ADDRESS, abi:bettingAbi, functionName:'currentEpoch' }),
      ]);
      const epoch = currentEpoch > 0n ? currentEpoch : 0n;
      const epochTopRaw = await readClient.readContract({ address:BETTING_VAULT_ADDRESS, abi:bettingAbi, functionName:'getEpochTopBettors', args:[epoch] });
      const rows = buildRows(parseTuple(top), parseEpochTuple(epochTopRaw), lang);
      setState({ loading:false, error:null, rows, epoch:Number(epoch), block:Number(block.number) });
    } catch (err) {
      setState({ loading:false, error:err?.shortMessage || err?.message || 'Could not read on-chain leaderboard.', rows:[], epoch:null, block:null });
    }
  },[lang]);
  useEffect(()=>{ load(); },[load]);
  const total = state.rows.reduce((a,r)=>a+r.total,0n);
  const active = state.rows.reduce((a,r)=>a+BigInt(r.activeBets),0n);
  const epochVol = state.rows.reduce((a,r)=>a+r.epochWagered,0n);

  return <main className="min-h-screen bg-ink-950 pt-28 text-white">
    <section className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <button onClick={()=>setRoute('markets')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-white/45 hover:text-acid">← Back to markets</button>
          <div className="inline-flex rounded-full bg-acid/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-acid ring-1 ring-acid/25">On-chain getters · No DB</div>
          <h1 className="font-display mt-4 text-5xl tracking-tight text-white md:text-7xl">Leaderboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">Real top bettors read directly from `getTopBettors()` and `getEpochTopBettors()` on the BettingVault. No database, no off-chain indexer.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" onClick={load}>{state.loading ? 'Syncing…' : 'Refresh on-chain'}</Btn>
          <Btn as="a" href={`https://bscscan.com/address/${BETTING_VAULT_ADDRESS}`} target="_blank" variant="primary">BscScan <Icon.arrow/></Btn>
        </div>
      </div>
      {state.error && <div className="mb-5 rounded-2xl border border-down/30 bg-down/10 p-4 text-sm text-down">{state.error}</div>}
      {state.loading && <Skeleton/>}
      {!state.loading && <>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Ranked wallets" value={String(state.rows.length)} sub="top 10 on-chain" />
          <Stat label="Total wagered" value={fmtBnb(total)} sub="from contract totals" />
          <Stat label="Active bet count" value={String(active)} sub="eligible activity" />
          <Stat label="Current epoch" value={state.epoch ?? '—'} sub={state.block ? `block ${state.block}` : 'BSC'} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-white">Top bettors</h2>
              <span className="text-xs text-white/35">ranked by all-time wagered BNB</span>
            </div>
            {state.rows.length ? state.rows.map((r,i)=><Row key={r.address} row={r} idx={i}/>) : <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/45">No on-chain leaderboard entries yet. First real bets will appear here automatically.</div>}
          </div>
          <aside className="rounded-2xl border border-white/10 bg-ink-900/70 p-4">
            <h2 className="font-display text-2xl text-white">Reward epoch</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/45">The reward system uses the same on-chain wager data. Users need enough POLYFLAP and active betting activity to claim deposited tax rewards.</p>
            <div className="mt-4 space-y-3">
              <Stat label="Epoch wagered" value={fmtBnb(epochVol)} sub="top bettors visible here" />
              <div className="rounded-xl bg-white/[0.045] p-3 text-xs text-white/45 ring-1 ring-white/8">Leaderboard source: `WorldCupBettingVault.getTopBettors()`.<br/>Epoch boosts source: `getEpochTopBettors(currentEpoch)`.</div>
            </div>
          </aside>
        </div>
      </>}
    </section>
  </main>;
}

export { LeaderboardPage };
