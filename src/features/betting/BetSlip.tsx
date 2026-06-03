import { useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther } from 'viem';
import { bsc } from 'viem/chains';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Tooltip } from '../../components/ui';
import { BSC_CHAIN_ID, BETTING_VAULT_ADDRESS, PROTOCOL_FEE_BPS, isPrivyConfigured } from '../../lib/env';
import { formatBnb } from '../../lib/format';
import { pickBscWallet, type BscWalletLike } from '../wallet/walletHelpers';
import { OutcomeChip } from '../markets/components/OutcomeChip';
import type { MarketFixture, Outcome } from '../markets/types';
import { bettingAbi } from './abi';

type TxState = 'idle' | 'submitting' | 'success' | 'error';

export interface BetSlipProps {
  market: MarketFixture;
  outcome: Outcome | null;
  className?: string;
}

/** Wrapper: only mounts the Privy-driven slip when Privy is configured, so the
 *  unconfigured build renders an honest disabled slip without crashing on
 *  Privy hooks (which require a provider). */
export function BetSlip(props: BetSlipProps) {
  if (!isPrivyConfigured) return <StaticBetSlip {...props} />;
  return <ConnectedBetSlip {...props} />;
}

function StaticBetSlip(props: BetSlipProps) {
  return (
    <BetSlipView
      {...props}
      authenticated={false}
      canSign={false}
      walletReady={false}
      tx="idle"
      message={null}
      onConnect={() => undefined}
      onPlaceBet={() => undefined}
    />
  );
}

function ConnectedBetSlip(props: BetSlipProps) {
  const { authenticated, login } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const [tx, setTx] = useState<TxState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const canSign = authenticated && Boolean(bscWallet) && Boolean(BETTING_VAULT_ADDRESS);

  async function onPlaceBet(amount: string) {
    if (!props.outcome || !bscWallet || !BETTING_VAULT_ADDRESS) return;
    setTx('submitting');
    setMessage(null);
    try {
      await bscWallet.switchChain?.(BSC_CHAIN_ID);
      const provider = await bscWallet.getEthereumProvider?.();
      if (!provider) throw new Error('Wallet provider not ready');
      const client = createWalletClient({ chain: bsc, transport: custom(provider) });
      const [account] = await client.getAddresses();
      const hash = await client.writeContract({
        account,
        address: BETTING_VAULT_ADDRESS,
        abi: bettingAbi,
        functionName: 'placeBet',
        args: [BigInt(props.market.marketId), BigInt(props.outcome.teamId)],
        value: parseEther(amount),
      });
      setTx('success');
      setMessage(hash);
    } catch (error) {
      setTx('error');
      setMessage(error instanceof Error ? error.message : 'failed');
    }
  }

  return (
    <BetSlipView
      {...props}
      authenticated={authenticated}
      canSign={canSign}
      walletReady={walletsReady}
      tx={tx}
      message={message}
      onConnect={login}
      onPlaceBet={onPlaceBet}
    />
  );
}

interface ViewProps extends BetSlipProps {
  authenticated: boolean;
  canSign: boolean;
  walletReady: boolean;
  tx: TxState;
  message: string | null;
  onConnect: () => void;
  onPlaceBet: (amount: string) => void;
}

function BetSlipView({
  market: _market,
  outcome,
  className,
  authenticated,
  canSign,
  walletReady,
  tx,
  message,
  onConnect,
  onPlaceBet,
}: ViewProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0.1');

  const amountNum = Number(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0;
  const fee = valid ? (amountNum * PROTOCOL_FEE_BPS) / 10000 : 0;
  const net = valid ? amountNum - fee : 0;
  const disabled = !outcome || !valid || tx === 'submitting' || !walletReady || !canSign;

  return (
    <Card variant="elevated" padding="lg" className={['w-full', className].filter(Boolean).join(' ')}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-fg">{t('betting.placeBet')}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-fg-subtle">BSC · BNB</span>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.06em] text-fg-subtle">Selection</span>
        {outcome ? (
          <div>
            <OutcomeChip outcome={outcome} as="span" selected />
          </div>
        ) : (
          <span className="text-sm text-fg-muted">Choose an outcome to bet on</span>
        )}
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.06em] text-fg-subtle">{t('betting.amount')}</span>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          inputSize="lg"
          invalid={!valid && amount !== ''}
          rightSlot={<span className="font-mono text-xs text-fg-muted">BNB</span>}
        />
      </label>

      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg p-4">
        <Row label={t('betting.amount')} value={`${formatBnb(valid ? amountNum : 0)} BNB`} />
        <Row
          label={
            <Tooltip content={t('betting.feeNote')}>
              <span className="inline-flex cursor-help items-center gap-1 border-b border-dashed border-border-strong">
                {t('betting.platformFee')} (1%)
              </span>
            </Tooltip>
          }
          value={`-${formatBnb(fee)} BNB`}
        />
        <div className="my-1 border-t border-border-subtle" />
        <Row label={t('betting.netStake')} value={`${formatBnb(net)} BNB`} strong />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-fg-subtle">{t('betting.feeNote')}</p>

      <div className="mt-4">
        {!authenticated ? (
          <Button intent={isPrivyConfigured ? 'primary' : 'secondary'} fullWidth size="lg" disabled={!isPrivyConfigured} onClick={onConnect}>
            {t('wallet.connect')}
          </Button>
        ) : (
          <Button intent="primary" fullWidth size="lg" loading={tx === 'submitting'} disabled={disabled} onClick={() => onPlaceBet(amount)}>
            {t('betting.placeBet')}
          </Button>
        )}
      </div>

      {message && (
        <p
          className={
            'mt-3 break-words text-xs ' +
            (tx === 'error' ? 'text-danger' : tx === 'success' ? 'text-success' : 'text-fg-muted')
          }
        >
          {tx === 'success' ? `${t('tx.success')} · ${message.slice(0, 12)}…` : message}
        </p>
      )}
    </Card>
  );
}

function Row({ label, value, strong }: { label: React.ReactNode; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={'text-sm ' + (strong ? 'font-medium text-fg' : 'text-fg-muted')}>{label}</span>
      <span
        className={
          'font-mono tabular-nums ' + (strong ? 'text-base font-medium text-fg' : 'text-sm text-fg-muted')
        }
      >
        {value}
      </span>
    </div>
  );
}
