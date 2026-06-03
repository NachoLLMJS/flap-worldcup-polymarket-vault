import { useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther } from 'viem';
import { bsc } from 'viem/chains';
import { BSC_CHAIN_ID, BETTING_VAULT_ADDRESS, PROTOCOL_FEE_BPS } from '../../lib/env';
import { pickBscWallet, type BscWalletLike } from '../wallet/walletHelpers';
import type { Pick } from '../markets/types';
import { bettingAbi } from './abi';

export function BettingSlip({ pick, configReady }: { pick: Pick | null; configReady: boolean }) {
  if (!configReady) return <StaticSlip pick={pick} reason="Privy env missing" />;
  return <LiveBettingSlip pick={pick} />;
}

function StaticSlip({ pick, reason }: { pick: Pick | null; reason: string }) {
  return (
    <aside className="panel slip" aria-label="Order ticket">
      <div className="slipHeader">
        <h3>Order ticket</h3>
        <span className="badge">Waiting</span>
      </div>
      <div className="slipBody">
        <div className="slipPick">
          <span>Selection</span>
          <b>{pick ? `${pick.outcome.flag} ${pick.outcome.name}` : 'Choose a market'}</b>
          <span>{reason}</span>
        </div>
        <button className="btn primary" type="button" disabled>
          Connect to trade
        </button>
      </div>
    </aside>
  );
}

function LiveBettingSlip({ pick }: { pick: Pick | null }) {
  const { authenticated, login } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const [amount, setAmount] = useState('0.01');
  const [status, setStatus] = useState(
    'Choose a market, then buy or sell from your open position before the market closes.',
  );
  const [submitting, setSubmitting] = useState(false);
  const feePreview = Number.isFinite(Number(amount)) ? (Number(amount) * PROTOCOL_FEE_BPS) / 10000 : 0;
  const netPreview = Number.isFinite(Number(amount)) ? Number(amount) - feePreview : 0;

  async function writeMarket(action: 'buy' | 'sell') {
    if (!authenticated) return login();
    if (!pick || !bscWallet || !BETTING_VAULT_ADDRESS) return;
    setSubmitting(true);
    try {
      await bscWallet.switchChain?.(BSC_CHAIN_ID);
      const provider = await bscWallet.getEthereumProvider?.();
      if (!provider) throw new Error('Wallet provider not ready yet');
      const client = createWalletClient({ chain: bsc, transport: custom(provider) });
      const [account] = await client.getAddresses();
      const value = parseEther(amount);
      const hash =
        action === 'buy'
          ? await client.writeContract({
              account,
              address: BETTING_VAULT_ADDRESS,
              abi: bettingAbi,
              functionName: 'placeBet',
              args: [BigInt(pick.market.marketId), BigInt(pick.outcome.teamId)],
              value,
            })
          : await client.writeContract({
              account,
              address: BETTING_VAULT_ADDRESS,
              abi: bettingAbi,
              functionName: 'withdrawBet',
              args: [BigInt(pick.market.marketId), BigInt(pick.outcome.teamId), value],
            });
      setStatus(`${action === 'buy' ? 'Buy' : 'Sell'} sent: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${action} failed`);
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !pick || !walletsReady || !bscWallet || !BETTING_VAULT_ADDRESS || submitting;
  return (
    <aside className="panel slip" aria-label="Order ticket">
      <div className="slipHeader">
        <h3>Order ticket</h3>
        <span className="badge live">BSC</span>
      </div>
      <div className="slipBody">
        <div className="slipPick">
          <span>Selection</span>
          <b>{pick ? `${pick.outcome.flag} ${pick.outcome.name}` : 'Choose an outcome'}</b>
          <span>{pick?.market.title ?? 'No market selected'}</span>
        </div>
        <label className="stakeInput">
          <span>Amount BNB</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </label>
        <div className="stakeRow">
          <div className="slipStat">
            <span>Buy stake after fee</span>
            <b>{Math.max(netPreview, 0).toFixed(5)} BNB</b>
          </div>
          <div className="slipStat">
            <span>Entry fee</span>
            <b>{feePreview.toFixed(5)} BNB</b>
          </div>
          <div className="slipStat wide">
            <span>Sell rule</span>
            <b>Withdraw open stake before close</b>
          </div>
        </div>
        {!authenticated ? (
          <button className="btn primary" type="button" onClick={login}>
            Connect to trade
          </button>
        ) : (
          <div className="tradeActions">
            <button className="btn primary" type="button" disabled={disabled} onClick={() => writeMarket('buy')}>
              {submitting ? 'Sending…' : 'Buy'}
            </button>
            <button className="btn sell" type="button" disabled={disabled} onClick={() => writeMarket('sell')}>
              {submitting ? 'Sending…' : 'Sell / withdraw'}
            </button>
          </div>
        )}
        <div className="notice">{status}</div>
      </div>
    </aside>
  );
}
