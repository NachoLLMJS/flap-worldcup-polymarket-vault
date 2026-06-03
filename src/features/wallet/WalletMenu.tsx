import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import { isPrivyConfigured } from '../../lib/env';
import { shortAddress } from '../../lib/format';
import {
  pickBscWallet,
  pickUserBscAddress,
  type BscWalletLike,
  type UserWalletLike,
} from './walletHelpers';

/** Connect / connected wallet control for the navbar.
 *  Renders an honest disabled state when Privy is not configured. */
export function WalletMenu() {
  if (!isPrivyConfigured) return <DisabledWallet />;
  return <PrivyWalletMenu />;
}

function DisabledWallet() {
  const { t } = useTranslation();
  return (
    <Button intent="secondary" size="md" disabled title="VITE_PRIVY_APP_ID not set">
      {t('wallet.connect')}
    </Button>
  );
}

function PrivyWalletMenu() {
  const { t } = useTranslation();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const bscWallet = pickBscWallet(wallets as BscWalletLike[]);
  const userWalletAddress = pickUserBscAddress(user as UserWalletLike | null);
  const address = bscWallet?.address ?? userWalletAddress ?? undefined;

  if (!ready)
    return (
      <Button intent="secondary" size="md" loading>
        {t('wallet.connecting')}
      </Button>
    );

  if (!authenticated)
    return (
      <Button intent="primary" size="md" onClick={login}>
        {t('wallet.connect')}
      </Button>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 h-10 sm:inline-flex">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
        <span className="font-mono text-xs text-fg">{shortAddress(address)}</span>
      </span>
      <Button intent="ghost" size="md" onClick={logout}>
        {t('wallet.disconnect')}
      </Button>
    </div>
  );
}
