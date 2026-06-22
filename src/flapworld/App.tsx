// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   Polyflap — root app: routing + wallet via context
   Real wallet/trading (Privy + viem) when VITE_PRIVY_APP_ID is set,
   otherwise an honest mock/preview. See ./wallet.tsx.
   ============================================================ */
import { Component, useState, useCallback, type ReactNode } from 'react';
import { isPrivyConfigured } from '../lib/env';
import { LangProvider } from './i18n';
import { Nav, HomePage, AboutPage } from './home';
import { MarketsPage } from './markets';
import { LeaderboardPage } from './leaderboard';
import { PortfolioPage } from './portfolio';
import { MockWalletProvider, RealWalletProvider, useWallet } from './wallet';

const LOADER_VIDEO_SRC = '/uploads/polyflap-loader-privy-wallet.mp4';

function IntroVideo({ onDone }: { onDone: () => void }){
  const [leaving, setLeaving] = useState(false);
  const finish = useCallback(()=>{
    setLeaving(true);
    window.setTimeout(onDone, 850);
  }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center bg-black transition-opacity duration-700 ease-out ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      <video
        src={LOADER_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        className="h-full w-full object-cover"
      />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${leaving ? 'opacity-100' : 'opacity-0'}`} style={{ background:'radial-gradient(70% 55% at 50% 50%, rgba(0,0,0,0.05), rgba(0,0,0,0.88))' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
      <button
        onClick={finish}
        className={`absolute bottom-6 right-6 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur transition hover:border-acid/60 hover:text-acid ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        Skip
      </button>
    </div>
  );
}

function App(){
  const [showIntro, setShowIntro] = useState(true);
  const [route, setRoute] = useState<string>(()=> sessionStorage.getItem('fw_route') || 'home');
  const { wallet, positions, activity, connect, disconnect, buyPosition, sellPosition, sendWalletBnb, claimMarket, claimTaxRewards, taxRewards, refreshTaxRewards, resolveMarket } = useWallet();

  const go = useCallback((r: string)=>{
    setRoute(r);
    try { sessionStorage.setItem('fw_route', r); } catch(e){}
    window.scrollTo(0,0);
  },[]);

  return (
    <>
      {showIntro && <IntroVideo onDone={()=>setShowIntro(false)} />}
      <Nav route={route} setRoute={go} wallet={wallet} onConnect={connect} onDisconnect={disconnect} overHero={route==='home'} />
      {route==='home' && <HomePage setRoute={go} />}
      {route==='markets' && <MarketsPage wallet={wallet} onConnect={connect} positions={positions} onBuy={buyPosition} onSell={sellPosition} onClaim={claimMarket} onResolve={resolveMarket} />}
      {route==='leaderboard' && <LeaderboardPage setRoute={go} />}
      {route==='portfolio' && <PortfolioPage wallet={wallet} onConnect={connect} onDisconnect={disconnect} positions={positions} activity={activity} onSell={sellPosition} onSendWalletBnb={sendWalletBnb} onResolve={resolveMarket} onClaim={claimMarket} taxRewards={taxRewards} onClaimTaxRewards={claimTaxRewards} onRefreshTaxRewards={refreshTaxRewards} setRoute={go} />}
      {route==='about' && <AboutPage setRoute={go} />}
    </>
  );
}

/* If Privy fails to initialize (e.g. a wrong/typo VITE_PRIVY_APP_ID, or a
   network/SDK error), fall back to preview mode instead of a blank screen. */
class WalletBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(){ return { failed: true }; }
  componentDidCatch(err: unknown){ console.error('[Polyflap] live wallet failed — falling back to preview:', err); }
  render(){ return this.state.failed ? this.props.fallback : this.props.children; }
}

function Root(){
  if (isPrivyConfigured){
    return (
      <LangProvider>
        <WalletBoundary fallback={<MockWalletProvider><App/></MockWalletProvider>}>
          <RealWalletProvider><App/></RealWalletProvider>
        </WalletBoundary>
      </LangProvider>
    );
  }
  return (
    <LangProvider>
      <MockWalletProvider><App/></MockWalletProvider>
    </LangProvider>
  );
}

export { App, Root };
