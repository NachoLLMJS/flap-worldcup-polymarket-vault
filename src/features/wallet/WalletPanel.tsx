import { useMemo, useState } from 'react';
import { usePrivy, useWallets, useCreateWallet, useConnectWallet } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther } from 'viem';
import { bsc } from 'viem/chains';
import { BSC_CHAIN_ID, BETTING_VAULT_ADDRESS } from '../../lib/env';
import { shortAddress } from '../../lib/format';
import {
  pickBscWallet,
  pickUserBscAddress,
  walletDisplay,
  type BscWalletLike,
  type UserWalletLike,
} from './walletHelpers';

function isEvmAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

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
  const [withdrawTo, setWithdrawTo] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState(
    'Send BNB from the Privy wallet to any BSC address. Keep a little BNB for gas.',
  );
  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
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

  async function withdrawNativeBnb() {
    if (!bscWallet) {
      setWithdrawStatus('Connect or create the Privy BSC wallet first.');
      return;
    }
    const to = withdrawTo.trim();
    if (!isEvmAddress(to)) {
      setWithdrawStatus('Enter a valid 0x recipient address.');
      return;
    }
    const amount = withdrawAmount.trim();
    if (!amount || Number(amount) <= 0) {
      setWithdrawStatus('Enter a BNB amount greater than 0.');
      return;
    }
    setWithdrawing(true);
    try {
      await bscWallet.switchChain?.(BSC_CHAIN_ID);
      const provider = await bscWallet.getEthereumProvider?.();
      if (!provider) throw new Error('Wallet provider not ready yet');
      const client = createWalletClient({ chain: bsc, transport: custom(provider) });
      const [account] = await client.getAddresses();
      const hash = await client.sendTransaction({ account, to, value: parseEther(amount) });
      setWithdrawStatus(`Withdraw sent: ${hash}`);
      setWithdrawAmount('');
    } catch (error) {
      setWithdrawStatus(error instanceof Error ? error.message : 'Withdraw failed');
    } finally {
      setWithdrawing(false);
    }
  }

  if (!ready)
    return (
      <div className="panel strong walletPanel walletPanelCentered">
        <div className="walletPanelCopy">
          <span className="walletEyebrow">BSC wallet access</span>
          <h3>Loading Privy…</h3>
          <p>Preparing wallet creation.</p>
        </div>
      </div>
    );
  if (!authenticated) {
    return (
      <div className="panel strong walletPanel walletPanelCentered">
        <div className="statusDot warn" />
        <div className="walletPanelCopy">
          <span className="walletEyebrow">BSC wallet access</span>
          <h3>Create wallet</h3>
          <p>Start with Privy before signing any BSC bet. No stake moves until you press the red confirm button in the slip.</p>
          <button className="btn primary walletPanelCta" type="button" onClick={login}>
            Create wallet
          </button>
        </div>
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
      <div className="withdrawBox">
        <div className="withdrawHead">
          <span>Wallet withdraw</span>
          <b>Send BNB out</b>
        </div>
        <label className="walletInput">
          <span>Recipient BSC address</span>
          <input
            value={withdrawTo}
            onChange={(event) => setWithdrawTo(event.target.value)}
            placeholder="0x..."
            spellCheck={false}
          />
        </label>
        <label className="walletInput">
          <span>Amount BNB</span>
          <input
            value={withdrawAmount}
            onChange={(event) => setWithdrawAmount(event.target.value)}
            placeholder="0.01"
            inputMode="decimal"
          />
        </label>
        <button className="btn primary" type="button" disabled={!bscWallet || withdrawing} onClick={withdrawNativeBnb}>
          {withdrawing ? 'Sending…' : 'Withdraw from Privy wallet'}
        </button>
        <div className="notice withdrawNotice">{withdrawStatus}</div>
      </div>
    </div>
  );
}
