// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap — wallet + trading layer
   Two providers behind one context:
   - MockWalletProvider: no Privy (preview/demo) — seeded book.
   - RealWalletProvider: Privy login + viem placeBet/withdrawBet on BSC.
     Portfolio is reconstructed from on-chain getUserBet reads after connect/refresh,
     with local activity only used as metadata for cooldown timestamps.
   Root picks the provider via isPrivyConfigured. Trading always goes
   through the wallet's signature prompt — never auto-executed.
   ============================================================ */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { bsc } from 'viem/chains';
import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther, parseAbiItem, isAddress } from 'viem';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, BETTING_VAULT_ADDRESS, BSC_RPC_URL, BSC_CHAIN_ID, BETTING_VAULT_DEPLOY_BLOCK, VAULT_ADDRESS } from '../lib/env';
import { pickBscWallet, pickTwitterProfile, type BscWalletLike } from '../features/wallet/walletHelpers';
import { bettingAbi } from './abi';
import { readBetActivity, recordBetActivity } from '../features/betting/activity';
import { FEE_RATE, TEAM, ALL_MARKETS, MATCHES, GROUP_MARKETS, TOURNAMENT_MARKET } from './data';

/* viem read client (BSC mainnet) */
export const publicClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC_URL) });

const WITHDRAW_COOLDOWN_SECONDS = 5 * 60;

async function confirmedBetTiming(hash: `0x${string}`){
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
  const openedBlockTimestamp = Number(block.timestamp);
  return {
    blockNumber: Number(receipt.blockNumber),
    openedBlockTimestamp,
    withdrawUnlockTimestamp: openedBlockTimestamp + WITHDRAW_COOLDOWN_SECONDS,
  };
}

async function latestChainTimestamp(){
  const block = await publicClient.getBlock({ blockTag: 'latest' });
  return Number(block.timestamp);
}

const BET_PLACED_EVENT = parseAbiItem('event BetPlaced(uint256 indexed marketId, address indexed user, uint256 indexed teamId, uint256 amount)');

function sameAddress(a?: string, b?: string){ return !!a && !!b && a.toLowerCase() === b.toLowerCase(); }

function localBuyFor(address: string, marketId: number, teamId: number){
  return readBetActivity()
    .filter((a)=> a.action === 'buy' && a.marketId === marketId && a.teamId === teamId && (!a.userAddress || sameAddress(a.userAddress, address)))
    .sort((a,b)=> Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

async function betPlacedTimingFromLogs(address: `0x${string}`, marketId: number, teamId: number){
  if (!BETTING_VAULT_ADDRESS) return null;
  const latest = await publicClient.getBlockNumber();
  const fromBlocks = [
    BETTING_VAULT_DEPLOY_BLOCK ?? 0n,
    latest > 500000n ? latest - 500000n : 0n,
  ];
  for (const fromBlock of fromBlocks){
    try {
      const logs = await publicClient.getLogs({
        address: BETTING_VAULT_ADDRESS,
        event: BET_PLACED_EVENT,
        args: { marketId: BigInt(marketId), user: address, teamId: BigInt(teamId) },
        fromBlock,
        toBlock: 'latest',
      });
      const last = logs[logs.length - 1];
      if (!last) continue;
      const block = await publicClient.getBlock({ blockNumber: last.blockNumber });
      const openedBlockTimestamp = Number(block.timestamp);
      return {
        txHash: last.transactionHash,
        blockNumber: Number(last.blockNumber),
        openedBlockTimestamp,
        withdrawUnlockTimestamp: openedBlockTimestamp + WITHDRAW_COOLDOWN_SECONDS,
      };
    } catch (err) {
      console.warn('[Polyflap] BetPlaced log lookup failed', { marketId, teamId, fromBlock: fromBlock.toString(), err });
    }
  }
  return null;
}

function positionFromStake({ market, outcome, stakeWei, timing, txHash }: any){
  const net = Number(formatEther(stakeWei));
  const entry = +(net / (1 - FEE_RATE)).toFixed(6);
  const fee = +(entry - net).toFixed(6);
  const openedAt = timing?.openedBlockTimestamp ? timing.openedBlockTimestamp * 1000 : Date.now();
  return {
    id: `chain-${market.marketId}-${outcome.oid}`,
    marketId: market.id,
    outcomeId: outcome.id,
    chainMarketId: market.marketId,
    teamId: outcome.oid,
    entry,
    fee,
    net,
    mult: outcome.mult ?? 1,
    entryProb: outcome.prob ?? 0,
    openedAt,
    openedBlockNumber: timing?.blockNumber,
    openedBlockTimestamp: timing?.openedBlockTimestamp,
    withdrawUnlockTimestamp: timing?.withdrawUnlockTimestamp,
    onChainStakeWei: stakeWei.toString(),
    status: 'open',
    markFactor: 1.0,
    onChain: true,
    tx: txHash,
  };
}

function mergeOnchainPositions(current: any[], synced: any[]){
  const byKey = new Map<string, any>();
  current.filter((p)=>p.status !== 'open' || !p.onChain).forEach((p)=>byKey.set(p.id, p));
  [...current.filter((p)=>p.status === 'open' && p.onChain), ...synced].forEach((p)=>{
    const key = `${p.chainMarketId}:${p.teamId}`;
    const prev = byKey.get(key);
    byKey.set(key, { ...(prev || {}), ...p, id: prev?.id || p.id });
  });
  return Array.from(byKey.values()).sort((a,b)=>(b.openedAt||0)-(a.openedAt||0));
}

/* Privy config — matches the new acid theme */
export const privyConfig = {
  appId: PRIVY_APP_ID as string,
  clientId: PRIVY_CLIENT_ID as string | undefined,
  config: {
    defaultChain: bsc,
    supportedChains: [bsc],
    appearance: {
      theme: 'dark',
      accentColor: '#d7ff36',
      showWalletLoginFirst: false,
      walletList: ['metamask', 'binance'],
      walletChainType: 'ethereum-only',
    },
    loginMethods: [
      'tiktok',
      'discord',
      'binance',
      'google',
      'github',
      'email',
    ],
    // Privy's hosted modal follows this visual order. TikTok takes Google's old
    // visible slot, and Binance Wallet takes GitHub's old visible slot.
    loginMethodsAndOrder: {
      primary: [
        'metamask',
        'tiktok',
        'discord',
        'binance',
        'google',
        'email',
      ],
      overflow: ['github'],
    },
    embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
  },
};

/* deterministic cosmetic identity (handle + join date) derived from an address */
const HANDLES = ['golazo','libero','ultra','panenka','rabona','nutmeg','catenaccio','hattrick','keeper','sweeper','offside','stoppage','derby','var','poacher','maestro'];
function rngFromStr(s: string){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} let a=h>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const txHash = ()=> '0x'+Array.from({length:6},()=>Math.floor(Math.random()*16).toString(16)).join('')+'…'+Array.from({length:4},()=>Math.floor(Math.random()*16).toString(16)).join('');
const shortAddr = (a: string)=> a ? a.slice(0,6)+'…'+a.slice(-4) : '';
const ensFrom = (addr: string)=>{ const r=rngFromStr(addr||'x'); return HANDLES[Math.floor(r()*HANDLES.length)] + (r()>0.5? String(Math.floor(r()*90)+10):'') + '.bnb'; };
const sinceFrom = (addr: string)=>{ const r=rngFromStr('since'+(addr||'x')); return Date.now() - (40+Math.floor(r()*120))*86400e3; };

let _pid = 1, _aid = 1;

/* mock book seed (demo only; preview mode) */
function seedPortfolio(){
  const now = Date.now();
  const positions: any[] = [], activity: any[] = [];
  const mk = (key: string, outcomeId: string, entry: number, status: string, markFactor: number, agoH: number)=>{
    const m = ALL_MARKETS.find(x=>x.id===key); if(!m) return;
    const o: any = m.outcomes.find((x: any)=>x.id===outcomeId); if(!o) return;
    const fee = +(entry*FEE_RATE).toFixed(4), net = +(entry-fee).toFixed(4);
    const openedAt = now - agoH*3600e3;
    const pos: any = { id:'p'+(_pid++), marketId:key, outcomeId, chainMarketId:m.marketId, teamId:o.oid, entry, fee, net, mult:o.mult, entryProb:o.prob, openedAt, status, markFactor, onChain:false };
    if (status==='won'){ pos.payout = +(net*o.mult).toFixed(4); pos.settledAt = openedAt + 6*3600e3; }
    if (status==='lost'){ pos.payout = 0; pos.settledAt = openedAt + 6*3600e3; }
    if (status==='withdrawn'){ pos.payout = net; pos.settledAt = openedAt + 2*3600e3; }
    positions.push(pos);
    activity.push({ id:'a'+(_aid++), type:'buy', marketId:key, outcomeId, amount:entry, ts:openedAt, tx:txHash() });
    if (status==='won'||status==='lost') activity.push({ id:'a'+(_aid++), type:'settle', win:status==='won', marketId:key, outcomeId, amount:pos.payout, ts:pos.settledAt, tx:txHash() });
    if (status==='withdrawn') activity.push({ id:'a'+(_aid++), type:'sell', marketId:key, outcomeId, amount:pos.payout, ts:pos.settledAt, tx:txHash() });
  };
  const open = ALL_MARKETS.filter(m=> m.baseKind==='open' || m.baseKind==='soon');
  const resolved = MATCHES.filter(m=> m.resolved);
  if (open[1]) mk(open[1].id, open[1].outcomes[0].id, 1.20, 'open', 1.42, 30);
  if (open[4]) mk(open[4].id, open[4].outcomes[2].id, 0.60, 'open', 0.74, 18);
  if (GROUP_MARKETS[2]) mk(GROUP_MARKETS[2].id, GROUP_MARKETS[2].outcomes[0].id, 2.00, 'open', 1.10, 52);
  if (TOURNAMENT_MARKET) mk(TOURNAMENT_MARKET.id, TOURNAMENT_MARKET.outcomes[1].id, 0.80, 'open', 1.55, 70);
  if (resolved[0]) mk(resolved[0].id, resolved[0].winner!, 1.00, 'won', 1, 60);
  if (resolved[1]) mk(resolved[1].id, (resolved[1].outcomes.find((o:any)=>o.id!==resolved[1].winner)||{}).id, 0.75, 'lost', 1, 72);
  if (resolved[2]) mk(resolved[2].id, resolved[2].winner!, 0.50, 'won', 1, 96);
  if (open[7]) mk(open[7].id, open[7].outcomes[0].id, 0.40, 'withdrawn', 1, 40);
  activity.sort((a,b)=> b.ts - a.ts);
  return { positions, activity };
}

type WalletApi = {
  mode: 'mock' | 'live';
  wallet: any;
  positions: any[];
  activity: any[];
  connect: () => void;
  disconnect: () => void;
  buyPosition: (p: { marketId:number; teamId:number; amount:number; key:string; outcomeId:string }) => Promise<void> | void;
  sellPosition: (positionId: string) => Promise<void> | void;
  sendWalletBnb: (to: string, amount: string) => Promise<string> | string;
  claimMarket: (marketId: number) => Promise<void> | void;
  claimTaxRewards: () => Promise<void> | void;
  refreshTaxRewards: () => Promise<void> | void;
  taxRewards: any;
  resolveMarket: (marketId: number) => Promise<void> | void;
};
const WalletContext = createContext<WalletApi | null>(null);
export const useWallet = () => useContext(WalletContext) as WalletApi;

/* ---------------- MOCK (no Privy) ---------------- */
export function MockWalletProvider({ children }: { children: React.ReactNode }){
  const [wallet, setWallet] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const connect = useCallback(()=>{
    const hex='0123456789abcdef'; let a=''; for(let i=0;i<40;i++) a+=hex[Math.floor(Math.random()*16)];
    const full='0x'+a;
    setWallet({ address: full, short: shortAddr(full), ens: ensFrom(full), balance: 12.480, since: sinceFrom(full) });
    const seed = seedPortfolio();
    setPositions(seed.positions);
    setActivity([{ id:'a'+(_aid++), type:'connect', ts:Date.now(), tx:txHash() }, ...seed.activity]);
  },[]);
  const disconnect = useCallback(()=>{ setWallet(null); setPositions([]); setActivity([]); },[]);

  const buyPosition = useCallback(({ amount, key, outcomeId }: any)=>{
    const m = ALL_MARKETS.find(x=>x.id===key); if(!m) return;
    const o: any = m.outcomes.find((x: any)=>x.id===outcomeId); if(!o) return;
    const fee = +(amount*FEE_RATE).toFixed(4), net = +(amount-fee).toFixed(4);
    const pos = { id:'p'+(_pid++), marketId:key, outcomeId, chainMarketId:m.marketId, teamId:o.oid, entry:amount, fee, net, mult:o.mult, entryProb:o.prob, openedAt:Date.now(), status:'open', markFactor:1.0, fresh:true, onChain:false };
    setPositions(ps=>[pos, ...ps]);
    setActivity(a=>[{ id:'a'+(_aid++), type:'buy', marketId:key, outcomeId, amount, ts:Date.now(), tx:txHash() }, ...a]);
    setWallet((w: any)=> w ? { ...w, balance:+Math.max(0, w.balance-amount).toFixed(4) } : w);
  },[]);

  const sellPosition = useCallback((positionId: string)=>{
    setPositions(ps=>{
      const p = ps.find(x=>x.id===positionId);
      if (!p || p.status!=='open') return ps;
      setWallet((w: any)=> w ? { ...w, balance:+(w.balance + p.net).toFixed(4) } : w);
      setActivity(a=>[{ id:'a'+(_aid++), type:'sell', marketId:p.marketId, outcomeId:p.outcomeId, amount:p.net, ts:Date.now(), tx:txHash() }, ...a]);
      return ps.map(x=> x.id===positionId ? { ...x, status:'withdrawn', payout:p.net, settledAt:Date.now() } : x);
    });
  },[]);

  const sendWalletBnb = useCallback((to: string, amount: string)=>{
    const value = Number(amount);
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error('Enter a valid destination wallet');
    if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid BNB amount');
    if (wallet && value > wallet.balance) throw new Error('Not enough BNB in wallet');
    const hash = txHash();
    setWallet((w: any)=> w ? { ...w, balance:+Math.max(0, w.balance-value).toFixed(6) } : w);
    setActivity(a=>[{ id:'a'+(_aid++), type:'walletWithdraw', amount:value, to, ts:Date.now(), tx:hash }, ...a]);
    return hash;
  },[wallet]);

  const claimMarket = useCallback((marketId: number)=>{
    setActivity(a=>[{ id:'a'+(_aid++), type:'claim', marketId:'m'+marketId, amount:0, ts:Date.now(), tx:txHash() }, ...a]);
  },[]);
  const resolveMarket = useCallback((marketId: number)=>{
    setActivity(a=>[{ id:'a'+(_aid++), type:'resolve', marketId:'m'+marketId, amount:0, ts:Date.now(), tx:txHash() }, ...a]);
  },[]);

  const claimTaxRewards = useCallback(()=>{
    setActivity(a=>[{ id:'a'+(_aid++), type:'taxClaim', amount:0, ts:Date.now(), tx:txHash() }, ...a]);
  },[]);
  const refreshTaxRewards = useCallback(()=>{},[]);
  const taxRewards = useMemo(()=>({ claimableBnb: 0, claimableWei: '0', currentEpoch: null, activeBets: 0, totalUserWageredBnb: 0, totalTaxRewardsReceivedBnb: 0, flapVaultBalanceBnb: 0, loading: false, error: null }),[]);

  const api = useMemo<WalletApi>(()=>({ mode:'mock', wallet, positions, activity, connect, disconnect, buyPosition, sellPosition, sendWalletBnb, claimMarket, claimTaxRewards, refreshTaxRewards, taxRewards, resolveMarket }),[wallet,positions,activity,connect,disconnect,buyPosition,sellPosition,sendWalletBnb,claimMarket,claimTaxRewards,refreshTaxRewards,taxRewards,resolveMarket]);
  return <WalletContext.Provider value={api}>{children}</WalletContext.Provider>;
}

/* ---------------- LIVE (Privy + viem) ---------------- */
function LiveWalletProvider({ children }: { children: React.ReactNode }){
  const { authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [positions, setPositions] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [taxRewards, setTaxRewards] = useState<any>({
    claimableWei: '0',
    claimableBnb: 0,
    currentEpoch: null,
    previousEpoch: null,
    activeBets: 0,
    totalUserWageredBnb: 0,
    totalTaxRewardsReceivedBnb: 0,
    flapVaultBalanceBnb: 0,
    loading: false,
    error: null,
  });

  const bscWallet = useMemo(()=> pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const address = (bscWallet?.address || user?.wallet?.address || '') as string;

  const refreshBalance = useCallback(async ()=>{
    if (!address) return;
    try { const b = await publicClient.getBalance({ address: address as `0x${string}` }); setBalance(Number(formatEther(b))); } catch { /* keep */ }
  },[address]);

  const refreshTaxRewards = useCallback(async ()=>{
    if (!BETTING_VAULT_ADDRESS || !address) return;
    setTaxRewards((r:any)=>({ ...r, loading: true, error: null }));
    try {
      const account = address as `0x${string}`;
      const [claimableWei, currentEpoch, stats, totalTaxRewardsReceived, flapVaultBalance] = await Promise.all([
        publicClient.readContract({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'claimableTaxRewards', args:[account] }) as Promise<bigint>,
        publicClient.readContract({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'currentEpoch' }) as Promise<bigint>,
        publicClient.readContract({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'getUserBettingStats', args:[account] }) as Promise<any>,
        publicClient.readContract({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'totalTaxRewardsReceived' }) as Promise<bigint>,
        VAULT_ADDRESS ? publicClient.getBalance({ address: VAULT_ADDRESS }) : Promise.resolve(0n),
      ]);
      setTaxRewards({
        claimableWei: claimableWei.toString(),
        claimableBnb: Number(formatEther(claimableWei)),
        currentEpoch: Number(currentEpoch),
        previousEpoch: currentEpoch > 0n ? Number(currentEpoch - 1n) : null,
        totalUserWageredBnb: Number(formatEther(stats?.[0] || 0n)),
        activeBets: Number(stats?.[1] || 0n),
        totalTaxRewardsReceivedBnb: Number(formatEther(totalTaxRewardsReceived || 0n)),
        flapVaultBalanceBnb: Number(formatEther(flapVaultBalance || 0n)),
        loading: false,
        error: null,
      });
    } catch (err:any) {
      setTaxRewards((r:any)=>({ ...r, loading: false, error: err?.shortMessage || err?.message || 'Could not load rewards' }));
    }
  },[address]);

  useEffect(()=>{ if (authenticated && address) refreshTaxRewards(); }, [authenticated, address, refreshTaxRewards]);

  useEffect(()=>{ if (authenticated && address) refreshBalance(); }, [authenticated, address, refreshBalance]);
  useEffect(()=>{
    if (authenticated && address && activity.length===0){
      const persisted = readBetActivity()
        .filter((ba)=> !ba.userAddress || sameAddress(ba.userAddress, address))
        .map((ba)=>{
          const key = 'm'+ba.marketId;
          const o: any = ALL_MARKETS.find(x=>x.id===key)?.outcomes.find((x:any)=>x.oid===ba.teamId);
          return { id:ba.id, type:ba.action, marketId:key, outcomeId:o?.id, amount:Number(ba.amountBnb), ts:Date.parse(ba.createdAt), tx: shortAddr(ba.txHash) };
        });
      setActivity([{ id:'a'+(_aid++), type:'connect', ts:Date.now(), tx:txHash() }, ...persisted]);
    }
  }, [authenticated, address]); // eslint-disable-line

  // live mode: X (Twitter) name + profile photo when the login is via X,
  // otherwise the real address (no invented handle on a money app).
  const wallet = useMemo(()=>{
    if (!(authenticated && address)) return null;
    const tw = pickTwitterProfile(user);
    const avatar = tw && tw.profilePictureUrl ? tw.profilePictureUrl.replace('_normal','_400x400') : undefined;
    const handle = (tw && tw.username) || undefined;
    const display = (tw && (tw.name || (tw.username && '@'+tw.username))) || shortAddr(address);
    return { address, short: shortAddr(address), ens: display, handle, avatar, balance, since: sinceFrom(address) };
  }, [authenticated, address, balance, user]);

  async function getWalletClient(){
    if (!bscWallet) throw new Error('No BSC wallet connected');
    await bscWallet.switchChain?.(BSC_CHAIN_ID);
    const provider = await bscWallet.getEthereumProvider?.();
    if (!provider) throw new Error('Wallet provider not ready');
    return createWalletClient({ chain: bsc, transport: custom(provider as any) });
  }

  const syncOpenPositions = useCallback(async ()=>{
    if (!BETTING_VAULT_ADDRESS || !authenticated || !address) return;
    const account = address as `0x${string}`;
    const metas: any[] = [];
    const contracts = ALL_MARKETS.flatMap((m)=> m.outcomes.map((o: any)=>{
      metas.push({ market:m, outcome:o });
      return { address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'getUserBet', args:[BigInt(m.marketId), account, BigInt(o.oid)] };
    }));
    try {
      const results = await publicClient.multicall({ contracts, allowFailure: true });
      const found: any[] = [];
      for (let i=0; i<results.length; i++){
        const r: any = results[i];
        if (r.status !== 'success') continue;
        const stakeWei = r.result as bigint;
        if (!stakeWei || stakeWei <= 0n) continue;
        const { market, outcome } = metas[i];
        const local = localBuyFor(address, market.marketId, outcome.oid);
        let timing = local?.blockTimestamp ? {
          blockNumber: local.blockNumber,
          openedBlockTimestamp: local.blockTimestamp,
          withdrawUnlockTimestamp: local.withdrawUnlockTimestamp ?? local.blockTimestamp + WITHDRAW_COOLDOWN_SECONDS,
        } : null;
        let txHash = local?.txHash;
        if (!timing){
          const logTiming = await betPlacedTimingFromLogs(account, market.marketId, outcome.oid);
          if (logTiming){
            timing = logTiming;
            txHash = logTiming.txHash;
          }
        }
        found.push(positionFromStake({ market, outcome, stakeWei, timing, txHash }));
      }
      setPositions((ps)=>mergeOnchainPositions(ps, found));
    } catch (err) {
      console.warn('[Polyflap] on-chain position sync failed', err);
    }
  }, [authenticated, address]);

  useEffect(()=>{ if (authenticated && address) syncOpenPositions(); }, [authenticated, address, syncOpenPositions]);

  const connect = useCallback(()=>{ login(); },[login]);
  const disconnect = useCallback(()=>{ logout(); setPositions([]); setActivity([]); setBalance(0); },[logout]);

  const buyPosition = useCallback(async ({ marketId, teamId, amount, key, outcomeId }: any)=>{
    if (!BETTING_VAULT_ADDRESS) throw new Error('Betting vault not configured');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    // simulate first: a non-open / resolved market reverts BEFORE signing (no gas burned)
    await publicClient.simulateContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName: 'placeBet', args: [BigInt(marketId), BigInt(teamId)], value: parseEther(String(amount)) });
    const hash = await client.writeContract({                // wallet shows the signature prompt
      account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName: 'placeBet',
      args: [BigInt(marketId), BigInt(teamId)], value: parseEther(String(amount)),
    });
    const timing = await confirmedBetTiming(hash as `0x${string}`);
    const onchainStake = await publicClient.readContract({
      address: BETTING_VAULT_ADDRESS,
      abi: bettingAbi,
      functionName: 'getUserBet',
      args: [BigInt(marketId), account, BigInt(teamId)],
    }) as bigint;
    if (onchainStake <= 0n) throw new Error('Bet transaction confirmed, but no on-chain stake was found');
    const m = ALL_MARKETS.find(x=>x.id===key); const o: any = m?.outcomes.find((x:any)=>x.id===outcomeId);
    const fee = +(amount*FEE_RATE).toFixed(4), net = +(amount-fee).toFixed(4);
    const openedAt = timing.openedBlockTimestamp * 1000;
    const pos = { id:'p'+(_pid++), marketId:key, outcomeId, chainMarketId:marketId, teamId, entry:amount, fee, net, mult:o?.mult??1, entryProb:o?.prob??0, openedAt, openedBlockNumber:timing.blockNumber, openedBlockTimestamp:timing.openedBlockTimestamp, withdrawUnlockTimestamp:timing.withdrawUnlockTimestamp, onChainStakeWei:onchainStake.toString(), status:'open', markFactor:1.0, fresh:true, onChain:true, tx:hash };
    setPositions(ps=>[pos, ...ps]);
    setActivity(a=>[{ id:'a'+(_aid++), type:'buy', marketId:key, outcomeId, amount, ts:openedAt, tx: shortAddr(hash) }, ...a]);
    recordBetActivity({ action:'buy', marketId, marketTitle:m?.titleEn||'', outcomeName:o?.kind==='team'?TEAM(o.oid).en:(o?.id||''), outcomeFlag:o?.kind==='team'?TEAM(o.oid).flag:'', teamId, amountBnb:String(amount), txHash:hash, blockNumber:timing.blockNumber, blockTimestamp:timing.openedBlockTimestamp, withdrawUnlockTimestamp:timing.withdrawUnlockTimestamp, onChainStakeWei:onchainStake.toString(), userAddress:account });
    refreshBalance();
  },[bscWallet, refreshBalance]);

  const sellPosition = useCallback(async (positionId: string)=>{
    const p = positions.find(x=>x.id===positionId);
    if (!p || p.status!=='open') return;
    if (!BETTING_VAULT_ADDRESS) throw new Error('Betting vault not configured');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    let amountWei = parseEther(String(p.net));
    let openedBlockTimestamp = p.openedBlockTimestamp;
    if (!openedBlockTimestamp && p.tx){
      const receipt = await publicClient.getTransactionReceipt({ hash: p.tx as `0x${string}` });
      const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
      openedBlockTimestamp = Number(block.timestamp);
    }
    let verifiedOnchainStake = false;
    try {
      const onchain = await publicClient.readContract({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'getUserBet', args:[BigInt(p.chainMarketId), account, BigInt(p.teamId)] }) as bigint;
      if (onchain <= 0n) throw new Error('No on-chain stake found for this position');
      amountWei = onchain;
      verifiedOnchainStake = true;
    } catch (err) {
      if (p.onChain) throw err;
      /* mock/preview fallback only */
    }
    if (p.onChain && !verifiedOnchainStake) throw new Error('No verified on-chain stake found for this position');
    if (openedBlockTimestamp){
      const chainNow = await latestChainTimestamp();
      const unlockAt = openedBlockTimestamp + WITHDRAW_COOLDOWN_SECONDS;
      if (chainNow < unlockAt) throw new Error(`Withdraw unlocks in ${unlockAt - chainNow}s`);
    }
    await publicClient.simulateContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'withdrawBet', args:[BigInt(p.chainMarketId), BigInt(p.teamId), amountWei] });
    const hash = await client.writeContract({
      account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'withdrawBet',
      args: [BigInt(p.chainMarketId), BigInt(p.teamId), amountWei],
    });
    setPositions(ps=> ps.map(x=> x.id===positionId ? { ...x, status:'withdrawn', payout:p.net, settledAt:Date.now() } : x));
    setActivity(a=>[{ id:'a'+(_aid++), type:'sell', marketId:p.marketId, outcomeId:p.outcomeId, amount:p.net, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    recordBetActivity({ action:'sell', marketId:p.chainMarketId, marketTitle:'', outcomeName:TEAM(p.teamId).en, outcomeFlag:TEAM(p.teamId).flag, teamId:p.teamId, amountBnb:String(p.net), txHash:hash, userAddress:account });
    refreshBalance();
  },[positions, refreshBalance]);

  const resolveMarket = useCallback(async (marketId: number)=>{
    if (!BETTING_VAULT_ADDRESS) throw new Error('Betting vault not configured');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    await publicClient.simulateContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'resolveMarket', args:[BigInt(marketId)] });
    const hash = await client.writeContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'resolveMarket', args:[BigInt(marketId)] });
    await publicClient.waitForTransactionReceipt({ hash });
    setActivity(a=>[{ id:'a'+(_aid++), type:'resolve', marketId:'m'+marketId, amount:0, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    refreshBalance();
  },[bscWallet, refreshBalance]);

  const claimMarket = useCallback(async (marketId: number)=>{
    if (!BETTING_VAULT_ADDRESS) throw new Error('Betting vault not configured');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    await publicClient.simulateContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'claim', args:[BigInt(marketId)] });
    const hash = await client.writeContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'claim', args:[BigInt(marketId)] });
    await publicClient.waitForTransactionReceipt({ hash });
    setActivity(a=>[{ id:'a'+(_aid++), type:'claim', marketId:'m'+marketId, amount:0, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    refreshBalance();
  },[bscWallet, refreshBalance]);

  const claimTaxRewards = useCallback(async ()=>{
    if (!BETTING_VAULT_ADDRESS) throw new Error('Betting vault not configured');
    const claimableWei = BigInt(taxRewards.claimableWei || '0');
    if (claimableWei <= 0n) throw new Error('No claimable tax rewards for this wallet yet');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    await publicClient.simulateContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'claimTaxRewards', args:[] });
    const hash = await client.writeContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'claimTaxRewards', args:[] });
    await publicClient.waitForTransactionReceipt({ hash });
    setActivity(a=>[{ id:'a'+(_aid++), type:'taxClaim', amount: taxRewards.claimableBnb || 0, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    await refreshTaxRewards();
    refreshBalance();
  },[bscWallet, refreshBalance, refreshTaxRewards, taxRewards.claimableBnb, taxRewards.claimableWei]);

  const sendWalletBnb = useCallback(async (to: string, amount: string)=>{
    const destination = String(to || '').trim();
    if (!isAddress(destination)) throw new Error('Enter a valid destination wallet');
    const value = parseEther(String(amount || '0'));
    if (value <= 0n) throw new Error('Enter a valid BNB amount');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    const balanceWei = await publicClient.getBalance({ address: account });
    // Keep a conservative gas buffer so users do not strand the tx by sending their whole balance.
    const gasReserve = parseEther('0.0003');
    if (value + gasReserve > balanceWei) throw new Error('Amount too high. Leave at least 0.0003 BNB for gas.');
    const hash = await client.sendTransaction({ account, to: destination as `0x${string}`, value, chain: bsc });
    await publicClient.waitForTransactionReceipt({ hash });
    setActivity(a=>[{ id:'a'+(_aid++), type:'walletWithdraw', amount:Number(formatEther(value)), to:destination, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    refreshBalance();
    return hash;
  },[bscWallet, refreshBalance]);

  const api = useMemo<WalletApi>(()=>({ mode:'live', wallet, positions, activity, connect, disconnect, buyPosition, sellPosition, sendWalletBnb, claimMarket, claimTaxRewards, refreshTaxRewards, taxRewards, resolveMarket }),[wallet,positions,activity,connect,disconnect,buyPosition,sellPosition,sendWalletBnb,claimMarket,claimTaxRewards,refreshTaxRewards,taxRewards,resolveMarket]);
  return <WalletContext.Provider value={api}>{children}</WalletContext.Provider>;
}

export function RealWalletProvider({ children }: { children: React.ReactNode }){
  return (
    <PrivyProvider appId={privyConfig.appId} clientId={privyConfig.clientId} config={privyConfig.config as any}>
      <LiveWalletProvider>{children}</LiveWalletProvider>
    </PrivyProvider>
  );
}
