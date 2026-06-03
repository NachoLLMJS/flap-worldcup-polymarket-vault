import { PrivyProvider } from '@privy-io/react-auth';
import { bsc } from 'viem/chains';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from '../lib/env';
import { AppShell } from './AppShell';

/** Rendered when Privy is not configured: the UI still shows the market floor
 *  and fee preview but disables signing honestly. */
export function ConfigNeededApp() {
  return <AppShell configReady={false} />;
}

/** Rendered when VITE_PRIVY_APP_ID is present: wraps the app in PrivyProvider. */
export function PrivyReadyApp() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      clientId={PRIVY_CLIENT_ID}
      config={{
        defaultChain: bsc,
        supportedChains: [bsc],
        appearance: {
          theme: 'dark',
          accentColor: '#ff3434',
          showWalletLoginFirst: false,
        },
        loginMethods: ['google', 'twitter', 'email', 'wallet'],
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
      }}
    >
      <AppShell configReady />
    </PrivyProvider>
  );
}
