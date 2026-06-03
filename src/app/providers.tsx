import { PrivyProvider } from '@privy-io/react-auth';
import { RouterProvider } from 'react-router-dom';
import { bsc } from 'viem/chains';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, isPrivyConfigured } from '../lib/env';
import { router } from './router';

/** App root. Mounts the router, wrapped in PrivyProvider only when configured.
 *  Without VITE_PRIVY_APP_ID the app still renders fully (read-only) and shows
 *  honest disabled wallet/betting states. */
export function App() {
  if (!isPrivyConfigured) return <RouterProvider router={router} />;

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
      <RouterProvider router={router} />
    </PrivyProvider>
  );
}
