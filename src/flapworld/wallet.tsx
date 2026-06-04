// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap — wallet + trading layer
   Two providers behind one context:
   - MockWalletProvider: no Privy (preview/demo) — seeded book.
   - RealWalletProvider: Privy login + viem placeBet/withdrawBet on BSC.
     Portfolio reflects the user's REAL session trades (starts empty;
     on-chain pools are empty until there's volume).
   Root picks the provider via isPrivyConfigured. Trading always goes
   through the wallet's signature prompt — never auto-executed.
   ============================================================ */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { bsc } from 'viem/chains';
import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, BETTING_VAULT_ADDRESS, BSC_RPC_URL, BSC_CHAIN_ID } from '../lib/env';
import { pickBscWallet, pickTwitterProfile, type BscWalletLike } from '../features/wallet/walletHelpers';
import { bettingAbi } from './abi';
import { readBetActivity, recordBetActivity } from '../features/betting/activity';
import { FEE_RATE, TEAM, ALL_MARKETS, MATCHES, GROUP_MARKETS, TOURNAMENT_MARKET } from './data';

/* viem read client (BSC mainnet) */
const publicClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC_URL) });

/* Privy config — matches the new acid theme */
export const privyConfig = {
  appId: PRIVY_APP_ID as string,
  clientId: PRIVY_CLIENT_ID as string | undefined,
  config: {
    defaultChain: bsc,
    supportedChains: [bsc],
    appearance: { theme: 'dark', accentColor: '#d7ff36', showWalletLoginFirst: false },
    loginMethods: ['google', 'twitter', 'email', 'wallet'],
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

  const api = useMemo<WalletApi>(()=>({ mode:'mock', wallet, positions, activity, connect, disconnect, buyPosition, sellPosition }),[wallet,positions,activity,connect,disconnect,buyPosition,sellPosition]);
  return <WalletContext.Provider value={api}>{children}</WalletContext.Provider>;
}

/* ---------------- LIVE (Privy + viem) ---------------- */
function LiveWalletProvider({ children }: { children: React.ReactNode }){
  const { authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [positions, setPositions] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);

  const bscWallet = useMemo(()=> pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const address = (bscWallet?.address || user?.wallet?.address || '') as string;

  const refreshBalance = useCallback(async ()=>{
    if (!address) return;
    try { const b = await publicClient.getBalance({ address: address as `0x${string}` }); setBalance(Number(formatEther(b))); } catch { /* keep */ }
  },[address]);

  useEffect(()=>{ if (authenticated && address) refreshBalance(); }, [authenticated, address, refreshBalance]);
  useEffect(()=>{
    if (authenticated && address && activity.length===0){
      const persisted = readBetActivity().map((ba)=>{
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
    const m = ALL_MARKETS.find(x=>x.id===key); const o: any = m?.outcomes.find((x:any)=>x.id===outcomeId);
    const fee = +(amount*FEE_RATE).toFixed(4), net = +(amount-fee).toFixed(4);
    const pos = { id:'p'+(_pid++), marketId:key, outcomeId, chainMarketId:marketId, teamId, entry:amount, fee, net, mult:o?.mult??1, entryProb:o?.prob??0, openedAt:Date.now(), status:'open', markFactor:1.0, fresh:true, onChain:true, tx:hash };
    setPositions(ps=>[pos, ...ps]);
    setActivity(a=>[{ id:'a'+(_aid++), type:'buy', marketId:key, outcomeId, amount, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    recordBetActivity({ action:'buy', marketId, marketTitle:m?.titleEn||'', outcomeName:o?.kind==='team'?TEAM(o.oid).en:(o?.id||''), outcomeFlag:o?.kind==='team'?TEAM(o.oid).flag:'', teamId, amountBnb:String(amount), txHash:hash });
    refreshBalance();
  },[bscWallet, refreshBalance]);

  const sellPosition = useCallback(async (positionId: string)=>{
    const p = positions.find(x=>x.id===positionId);
    if (!p || p.status!=='open') return;
    if (!BETTING_VAULT_ADDRESS) throw new Error('Betting vault not configured');
    const client = await getWalletClient();
    const [account] = await client.getAddresses();
    let amountWei = parseEther(String(p.net));
    try {
      const onchain = await publicClient.readContract({ address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'getUserBet', args:[BigInt(p.chainMarketId), account, BigInt(p.teamId)] }) as bigint;
      if (onchain > 0n) amountWei = onchain;
    } catch { /* fall back to net */ }
    await publicClient.simulateContract({ account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'withdrawBet', args:[BigInt(p.chainMarketId), BigInt(p.teamId), amountWei] });
    const hash = await client.writeContract({
      account, address: BETTING_VAULT_ADDRESS, abi: bettingAbi, functionName:'withdrawBet',
      args: [BigInt(p.chainMarketId), BigInt(p.teamId), amountWei],
    });
    setPositions(ps=> ps.map(x=> x.id===positionId ? { ...x, status:'withdrawn', payout:p.net, settledAt:Date.now() } : x));
    setActivity(a=>[{ id:'a'+(_aid++), type:'sell', marketId:p.marketId, outcomeId:p.outcomeId, amount:p.net, ts:Date.now(), tx: shortAddr(hash) }, ...a]);
    recordBetActivity({ action:'sell', marketId:p.chainMarketId, marketTitle:'', outcomeName:TEAM(p.teamId).en, outcomeFlag:TEAM(p.teamId).flag, teamId:p.teamId, amountBnb:String(p.net), txHash:hash });
    refreshBalance();
  },[positions, refreshBalance]);

  const api = useMemo<WalletApi>(()=>({ mode:'live', wallet, positions, activity, connect, disconnect, buyPosition, sellPosition }),[wallet,positions,activity,connect,disconnect,buyPosition,sellPosition]);
  return <WalletContext.Provider value={api}>{children}</WalletContext.Provider>;
}

export function RealWalletProvider({ children }: { children: React.ReactNode }){
  return (
    <PrivyProvider appId={privyConfig.appId} clientId={privyConfig.clientId} config={privyConfig.config as any}>
      <LiveWalletProvider>{children}</LiveWalletProvider>
    </PrivyProvider>
  );
}
