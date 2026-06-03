import { useMemo, useState } from 'react';
import { usePrivy, useWallets, useCreateWallet, useConnectWallet } from '@privy-io/react-auth';
import { BSC_CHAIN_ID, BETTING_VAULT_ADDRESS } from '../../lib/env';
import { shortAddress } from '../../lib/format';
import {
  pickBscWallet,
  pickUserBscAddress,
  walletDisplay,
  type BscWalletLike,
  type UserWalletLike,
} from './walletHelpers';

export function WalletPanel({ configReady }: { configReady: boolean }) {
  if (!configReady) {
    return (
      <div className="panel strong walletPanel">
        <div className="statusDot warn" />
        <h3>Wallet setup required</h3>
        <p>
          Set <code>VITE_PRIVY_APP_ID</code> to enable login. Betting stays disabled until Privy and{' '}
          <code>VITE_BETTING_VAULT_ADDRESS</code> are configured.
        </p>
        <div className="walletRows">
          <div className="walletRow">
            <span>Chain</span>
            <b>BSC · {BSC_CHAIN_ID}</b>
          </div>
          <div className="walletRow">
            <span>Betting vault</span>
            <b>{shortAddress(BETTING_VAULT_ADDRESS)}</b>
          </div>
        </div>
      </div>
    );
  }
  return <PrivyWalletPanel />;
}

function PrivyWalletPanel() {
  const { ready, authenticated, login, user } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { connectWallet } = useConnectWallet();
  const [message, setMessage] = useState('BSC connection not checked yet.');
  const [busy, setBusy] = useState(false);
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const userWalletAddress = pickUserBscAddress(user as UserWalletLike | null);

  async function ensureBsc() {
    if (!bscWallet) return;
    setBusy(true);
    try {
      await bscWallet.switchChain?.(BSC_CHAIN_ID);
      setMessage('BSC ready · chain 56');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'BSC switch failed');
    } finally {
      setBusy(false);
    }
  }

  function reconnectWallet() {
    connectWallet({ walletChainType: 'ethereum-only' });
    setMessage('Open Privy and connect the EVM/BSC wallet again.');
  }

  async function createEmbedded() {
    setBusy(true);
    try {
      await createWallet();
      setMessage('Embedded wallet requested.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready)
    return (
      <div className="panel strong walletPanel">
        <h3>Loading Privy…</h3>
      </div>
    );
  if (!authenticated) {
    return (
      <div className="panel strong walletPanel">
        <div className="statusDot warn" />
        <h3>Connect</h3>
        <p>Log in before signing any BSC bet. No stake moves until you press the red confirm button in the slip.</p>
        <button className="btn primary" type="button" onClick={login}>
          Open Privy modal
        </button>
      </div>
    );
  }

  return (
    <div className="panel strong walletPanel">
      <div className="statusDot ok" />
      <h3>Wallet ready</h3>
      <p>
        {user?.email?.address ?? user?.google?.email ?? 'Signed in user'} · BSC wallet flow for real market
        transactions.
      </p>
      <div className="walletRows">
        <div className="walletRow">
          <span>Privy</span>
          <b>Connected</b>
        </div>
        <div className="walletRow">
          <span>BSC wallet</span>
          <b>{walletDisplay(bscWallet, userWalletAddress)}</b>
        </div>
        <div className="walletRow">
          <span>Runtime chain</span>
          <b>BSC · {BSC_CHAIN_ID}</b>
        </div>
        <div className="walletRow">
          <span>Betting vault</span>
          <b>{shortAddress(BETTING_VAULT_ADDRESS)}</b>
        </div>
      </div>
      <div className="walletActions">
        {!bscWallet && !userWalletAddress && (
          <button className="btn primary" type="button" disabled={!walletsReady || busy} onClick={createEmbedded}>
            Create BSC wallet
          </button>
        )}
        {!bscWallet && userWalletAddress && (
          <button className="btn primary" type="button" disabled={busy} onClick={reconnectWallet}>
            Reconnect BSC wallet
          </button>
        )}
        <button className="btn" type="button" disabled={!bscWallet || busy} onClick={ensureBsc}>
          Ensure BSC
        </button>
      </div>
      <div className="notice">{message}</div>
    </div>
  );
}
