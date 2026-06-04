import { useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { RouterProvider } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { bsc } from 'viem/chains';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, isPrivyConfigured } from '../lib/env';
import { router } from './router';
import { Preloader } from './Preloader';
import { ThemeProvider } from './ThemeProvider';
import { DesignProvider } from './DesignProvider';

function Shell() {
  // ?nopre skips the preloader (debug aid: its rAF load-gate freezes in
  // background/automation tabs, so this lets headless previews see the app).
  const skipPre = typeof location !== 'undefined' && new URLSearchParams(location.search).has('nopre');
  const [loaded, setLoaded] = useState(skipPre);
  return (
    <ThemeProvider>
      <DesignProvider>
        <AnimatePresence>{!loaded && <Preloader key="pre" onDone={() => setLoaded(true)} />}</AnimatePresence>
        <RouterProvider router={router} />
      </DesignProvider>
    </ThemeProvider>
  );
}

/** App root. Mounts the router (behind a premium preloader), wrapped in
 *  PrivyProvider only when configured. Without VITE_PRIVY_APP_ID the app still
 *  renders fully (read-only) with honest disabled wallet/betting states. */
export function App() {
  if (!isPrivyConfigured) return <Shell />;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      clientId={PRIVY_CLIENT_ID}
      config={{
        defaultChain: bsc,
        supportedChains: [bsc],
        appearance: {
          theme: 'dark',
          accentColor: '#9a2d3a',
          showWalletLoginFirst: false,
        },
        loginMethods: ['google', 'twitter', 'email', 'wallet'],
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
      }}
    >
      <Shell />
    </PrivyProvider>
  );
}
