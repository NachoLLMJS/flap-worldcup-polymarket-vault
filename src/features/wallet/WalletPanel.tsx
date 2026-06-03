import { useEffect, useMemo, useState } from 'react';
import { usePrivy, useWallets, useCreateWallet, useConnectWallet } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther } from 'viem';
import { bsc } from 'viem/chains';
import { BSC_CHAIN_ID, BETTING_VAULT_ADDRESS } from '../../lib/env';
import { shortAddress } from '../../lib/format';
import { readBetActivity, type BetActivity } from '../betting/activity';
import {
  fallbackIdentity,
  pickBscWallet,
  pickUserBscAddress,
  walletDisplay,
  type BscWalletLike,
  type UserWalletLike,
} from './walletHelpers';

function isEvmAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatBalanceFromWei(value: bigint) {
  if (value === 0n) return '0 BNB';
  const whole = value / 10n ** 18n;
  const fraction = value % 10n ** 18n;
  const fractionText = fraction.toString().padStart(18, '0').slice(0, 5).replace(/0+$/, '');
  if (whole === 0n && !fractionText) return '<0.00001 BNB';
  return `${whole.toLocaleString()}${fractionText ? `.${fractionText}` : ''} BNB`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'recent';
  }
}

export function WalletPanel({ configReady, mode = 'wallet' }: { configReady: boolean; mode?: 'wallet' | 'profile' }) {
  if (!configReady) {
    return (
      <div className={`panel strong walletPanel ${mode === 'profile' ? 'profilePanel' : ''}`}>
        <div className="statusDot warn" />
        <h3>{mode === 'profile' ? 'Profile setup required' : 'Wallet setup required'}</h3>
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
  return <PrivyWalletPanel mode={mode} />;
}

function PrivyWalletPanel({ mode }: { mode: 'wallet' | 'profile' }) {
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
  const [balance, setBalance] = useState('Not loaded');
  const [activity, setActivity] = useState<BetActivity[]>([]);
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const userWalletAddress = pickUserBscAddress(user as UserWalletLike | null);
  const walletAddress = (bscWallet?.address ?? userWalletAddress ?? '') as `0x${string}` | '';
  const identity = fallbackIdentity(user as UserWalletLike | null);
  const activeBetCount = Math.max(
    0,
    activity.filter((item) => item.action === 'buy').length - activity.filter((item) => item.action === 'sell').length,
  );

  useEffect(() => {
    function refreshActivity() {
      setActivity(readBetActivity());
    }
    refreshActivity();
    window.addEventListener('polyflap:bet-activity', refreshActivity);
    window.addEventListener('storage', refreshActivity);
    return () => {
      window.removeEventListener('polyflap:bet-activity', refreshActivity);
      window.removeEventListener('storage', refreshActivity);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      if (!walletAddress || !bscWallet) {
        setBalance(walletAddress ? 'Reconnect to refresh' : 'No wallet yet');
        return;
      }
      setBalance('Loading…');
      try {
        const provider = await bscWallet.getEthereumProvider?.();
        if (!provider || typeof provider !== 'object' || !('request' in provider)) {
          throw new Error('Wallet provider not ready');
        }
        const hexBalance = await (provider as { request: (args: { method: string; params: unknown[] }) => Promise<string> }).request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
        });
        if (!cancelled) setBalance(formatBalanceFromWei(BigInt(hexBalance)));
      } catch (error) {
        if (!cancelled) setBalance(error instanceof Error ? 'Balance unavailable' : 'Balance unavailable');
      }
    }
    loadBalance();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, bscWallet]);

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
          <span className="walletEyebrow">{mode === 'profile' ? 'Profile wallet' : 'BSC wallet access'}</span>
          <h3>Create wallet</h3>
          <p>Start with Privy before signing any BSC bet. No stake moves until you press the confirm button in the slip.</p>
          <button className="btn primary walletPanelCta" type="button" onClick={login}>
            Create wallet
          </button>
        </div>
      </div>
    );
  }

  const walletCore = (
    <>
      <div className="statusDot ok" />
      <h3>{mode === 'profile' ? 'Profile wallet' : 'Wallet ready'}</h3>
      <p>
        {identity} · BSC wallet flow for real market transactions.
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
          <span>BNB balance</span>
          <b>{balance}</b>
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
    </>
  );

  if (mode === 'wallet') {
    return <div className="panel strong walletPanel">{walletCore}</div>;
  }

  return (
    <div className="profileGrid">
      <section className="panel strong walletPanel profilePanel profileHeroCard">
        <div className="profileHeroTop">
          <div>
            <span className="walletEyebrow">Connected profile</span>
            <h3>{identity}</h3>
            <p>Your Privy identity, BSC wallet, BNB balance and betting controls in one place.</p>
          </div>
          <div className="profileAvatar">PF</div>
        </div>
        <div className="profileStats">
          <div>
            <span>BNB</span>
            <b>{balance}</b>
          </div>
          <div>
            <span>Wallet</span>
            <b>{walletDisplay(bscWallet, userWalletAddress)}</b>
          </div>
          <div>
            <span>Active bets</span>
            <b>{activeBetCount}</b>
          </div>
        </div>
      </section>

      <section className="panel strong walletPanel profilePanel">
        {walletCore}
      </section>

      <section className="panel strong profilePanel activeBetsPanel">
        <div className="profileSectionHead">
          <div>
            <span className="walletEyebrow">Active bets</span>
            <h3>Open positions</h3>
          </div>
          <span className="badge live">Local activity</span>
        </div>
        {activity.length ? (
          <div className="activityList">
            {activity.map((item) => (
              <article className="activityItem" key={item.id}>
                <div>
                  <b>{item.outcomeFlag} {item.outcomeName}</b>
                  <span>{item.marketTitle}</span>
                </div>
                <div>
                  <strong>{item.action === 'buy' ? '+' : '-'}{item.amountBnb} BNB</strong>
                  <small>{formatWhen(item.createdAt)} · {shortAddress(item.txHash)}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyBets">
            <b>No local active bets yet</b>
            <p>
              Place a buy order from Markets and it will appear here instantly. Full on-chain position indexing is kept honest
              until the vault read ABI/indexer is wired.
            </p>
          </div>
        )}
      </section>

      <section className="panel strong profilePanel withdrawPanel">
        <div className="withdrawBox profileWithdrawBox">
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
      </section>
    </div>
  );
}
