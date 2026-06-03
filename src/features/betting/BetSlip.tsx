import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Tooltip } from '../../components/ui';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { TxToast, type TxToastState } from '../../components/TxToast';
import { PROTOCOL_FEE_BPS, isPrivyConfigured } from '../../lib/env';
import { OutcomeChip } from '../markets/components/OutcomeChip';
import type { MarketFixture, Outcome } from '../markets/types';
import { useBettingActions } from './useBettingActions';
import { useMarketChain, type MarketChainData } from './useMarketChain';

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
  const chain = useMarketChain(props.market.marketId);
  return (
    <BetSlipView
      {...props}
      chain={chain.data}
      authenticated={false}
      ready={false}
      toast="idle"
      hash={null}
      errorMsg={null}
      onConnect={() => undefined}
      onPlaceBet={() => undefined}
    />
  );
}

function ConnectedBetSlip(props: BetSlipProps) {
  const actions = useBettingActions();
  const chain = useMarketChain(props.market.marketId);

  const toast: TxToastState =
    actions.status.state === 'awaiting-signature' || actions.status.state === 'mining'
      ? 'submitting'
      : actions.status.state === 'success'
        ? 'success'
        : actions.status.state === 'error'
          ? 'error'
          : 'idle';

  return (
    <BetSlipView
      {...props}
      chain={chain.data}
      authenticated={actions.authenticated}
      ready={actions.ready}
      toast={toast}
      hash={actions.status.hash}
      errorMsg={actions.status.error}
      onConnect={actions.login}
      onPlaceBet={(amount) => {
        if (props.outcome) void actions.placeBet(props.market.marketId, props.outcome.teamId, amount);
      }}
    />
  );
}

interface ViewProps extends BetSlipProps {
  chain: MarketChainData | null;
  authenticated: boolean;
  ready: boolean;
  toast: TxToastState;
  hash: `0x${string}` | null;
  errorMsg: string | null;
  onConnect: () => void;
  onPlaceBet: (amount: string) => void;
}

function BetSlipView({
  outcome,
  className,
  chain,
  authenticated,
  ready,
  toast,
  hash,
  errorMsg,
  onConnect,
  onPlaceBet,
}: ViewProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0.1');

  const amountNum = Number(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0;
  const fee = valid ? (amountNum * PROTOCOL_FEE_BPS) / 10000 : 0;
  const net = valid ? amountNum - fee : 0;

  const marketOpen = !chain || chain.status === 'open';
  const submitting = toast === 'submitting';
  const disabled = !outcome || !valid || submitting || !ready || !marketOpen;

  // Rough payout estimate: if you win, you take a proportional share of the
  // whole pool. estimate = net * (total + net) / (outcomePool + net)
  const selectedPool = outcome && chain ? Number((chain.pools[outcome.teamId] ?? 0n) / 10n ** 12n) / 1e6 : 0;
  const estPayout =
    outcome && chain && net > 0
      ? net * ((chain.totalPoolBnb + net) / (selectedPool + net))
      : 0;

  return (
    <Card variant="elevated" padding="lg" className={['w-full', className].filter(Boolean).join(' ')}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-fg">{t('betting.placeBet')}</h3>
        {chain && <StatusPill status={chain.status} />}
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
        <Row label={t('betting.amount')} value={<><AnimatedNumber value={valid ? amountNum : 0} /> BNB</>} />
        <Row
          label={
            <Tooltip content={t('betting.feeNote')}>
              <span className="inline-flex cursor-help items-center gap-1 border-b border-dashed border-border-strong">
                {t('betting.platformFee')} (1%)
              </span>
            </Tooltip>
          }
          value={<>-<AnimatedNumber value={fee} /> BNB</>}
        />
        <div className="my-1 border-t border-border-subtle" />
        <Row label={t('betting.netStake')} strong value={<><AnimatedNumber value={net} /> BNB</>} />
        {estPayout > 0 && (
          <Row
            label={t('betting.potentialWin')}
            value={<span className="text-accent"><AnimatedNumber value={estPayout} /> BNB</span>}
          />
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-fg-subtle">{t('betting.feeNote')}</p>

      <div className="mt-4">
        {!authenticated ? (
          <Button
            intent={isPrivyConfigured ? 'primary' : 'secondary'}
            fullWidth
            size="lg"
            disabled={!isPrivyConfigured}
            onClick={onConnect}
          >
            {t('wallet.connect')}
          </Button>
        ) : (
          <Button intent="primary" fullWidth size="lg" loading={submitting} disabled={disabled} onClick={() => onPlaceBet(amount)}>
            {marketOpen ? t('betting.placeBet') : t('betting.status.closed')}
          </Button>
        )}
      </div>

      <TxToast state={toast} hash={toast === 'success' ? hash : null} message={toast === 'error' ? errorMsg : null} />
    </Card>
  );
}

function StatusPill({ status }: { status: MarketChainData['status'] }) {
  const { t } = useTranslation();
  const map = {
    open: 'text-success',
    locked: 'text-warning',
    resolved: 'text-info',
    cancelled: 'text-danger',
    draft: 'text-fg-subtle',
  } as const;
  const key = status === 'draft' ? 'pending' : status;
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${map[status]}`}>
      {t(`betting.status.${key}`)}
    </span>
  );
}

function Row({ label, value, strong }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={'text-sm ' + (strong ? 'font-medium text-fg' : 'text-fg-muted')}>{label}</span>
      <span className={'font-mono tabular-nums ' + (strong ? 'text-base font-medium text-fg' : 'text-sm text-fg-muted')}>
        {value}
      </span>
    </div>
  );
}
