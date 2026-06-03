// @ts-nocheck -- ported claude.ai/design prototype; strict types pass is a follow-up
/* ============================================================
   FlapWorld — root app: routing + wallet via context
   Real wallet/trading (Privy + viem) when VITE_PRIVY_APP_ID is set,
   otherwise an honest mock/preview. See ./wallet.tsx.
   ============================================================ */
import { Component, useState, useCallback, type ReactNode } from 'react';
import { isPrivyConfigured } from '../lib/env';
import { LangProvider } from './i18n';
import { Nav, HomePage } from './home';
import { MarketsPage } from './markets';
import { PortfolioPage } from './portfolio';
import { MockWalletProvider, RealWalletProvider, useWallet } from './wallet';

function App(){
  const [route, setRoute] = useState<string>(()=> sessionStorage.getItem('fw_route') || 'home');
  const { wallet, positions, activity, connect, disconnect, buyPosition, sellPosition } = useWallet();

  const go = useCallback((r: string)=>{
    setRoute(r);
    try { sessionStorage.setItem('fw_route', r); } catch(e){}
    window.scrollTo(0,0);
  },[]);

  return (
    <>
      <Nav route={route} setRoute={go} wallet={wallet} onConnect={connect} onDisconnect={disconnect} overHero={route==='home'} />
      {route==='home' && <HomePage setRoute={go} />}
      {route==='markets' && <MarketsPage wallet={wallet} onConnect={connect} positions={positions} onBuy={buyPosition} onSell={sellPosition} />}
      {route==='portfolio' && <PortfolioPage wallet={wallet} onConnect={connect} onDisconnect={disconnect} positions={positions} activity={activity} onSell={sellPosition} setRoute={go} />}
    </>
  );
}

/* If Privy fails to initialize (e.g. a wrong/typo VITE_PRIVY_APP_ID, or a
   network/SDK error), fall back to preview mode instead of a blank screen. */
class WalletBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(){ return { failed: true }; }
  componentDidCatch(err: unknown){ console.error('[FlapWorld] live wallet failed — falling back to preview:', err); }
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
