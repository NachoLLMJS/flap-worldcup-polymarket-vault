import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Badge, Button, Card, Skeleton } from '../components/ui';
import { Flag } from '../components/Flag';
import { TxToast, type TxToastState } from '../components/TxToast';
import { isPrivyConfigured } from '../lib/env';
import { pickBscWallet, pickUserBscAddress, type BscWalletLike, type UserWalletLike } from '../features/wallet/walletHelpers';
import { usePositions, type Position } from '../features/betting/usePositions';
import { useBettingActions } from '../features/betting/useBettingActions';

export function PortfolioPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-medium text-fg sm:text-4xl">{t('nav.portfolio')}</h1>
        <p className="text-fg-muted">Your active bets, claimable winnings, and refunds.</p>
      </header>

      <div className="mt-8">{isPrivyConfigured ? <ConnectedPortfolio /> : <DisconnectedView />}</div>

      <div className="mt-6">
        <Button intent="secondary" onClick={() => navigate('/markets')}>
          {t('markets.all')}
        </Button>
      </div>
    </div>
  );
}

function DisconnectedView() {
  const { t } = useTranslation();
  return (
    <Card variant="default" padding="lg">
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="max-w-sm text-fg-muted">
          Connect your wallet to see your positions across all World Cup markets.
        </p>
        <Button intent="secondary" disabled>
          {t('wallet.connect')}
        </Button>
      </div>
    </Card>
  );
}

function ConnectedPortfolio() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const address =
    (pickBscWallet(wallets as BscWalletLike[])?.address as `0x${string}` | undefined) ??
    (pickUserBscAddress(user as UserWalletLike | null) as `0x${string}` | null);
  const { positions, loading, error, reload } = usePositions(authenticated ? address : null);
  const actions = useBettingActions();

  const toast: TxToastState =
    actions.status.state === 'awaiting-signature' || actions.status.state === 'mining'
      ? 'submitting'
      : actions.status.state === 'success'
        ? 'success'
        : actions.status.state === 'error'
          ? 'error'
          : 'idle';

  if (!authenticated) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="max-w-sm text-fg-muted">
            Connect your wallet to see your positions across all World Cup markets.
          </p>
          <Button intent="primary" onClick={login}>
            {t('wallet.connect')}
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={88} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-sm text-danger">{error}</p>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="max-w-sm text-fg-muted">No positions yet. Place a bet to get started.</p>
          <Button intent="primary" onClick={() => navigate('/markets')}>
            {t('markets.all')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {positions.map((p) => (
          <PositionRow
            key={p.marketId}
            position={p}
            onClaim={() => actions.claim(p.marketId).then(reload)}
            onRefund={() => actions.refund(p.marketId).then(reload)}
            busy={toast === 'submitting'}
          />
        ))}
      </div>
      <TxToast state={toast} hash={toast === 'success' ? actions.status.hash : null} message={toast === 'error' ? actions.status.error : null} />
    </>
  );
}

function PositionRow({
  position,
  onClaim,
  onRefund,
  busy,
}: {
  position: Position;
  onClaim: () => void;
  onRefund: () => void;
  busy: boolean;
}) {
  const { t, i18n } = useTranslation();
  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const title = zh ? position.zhTitle : position.title;

  return (
    <Card variant="default" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <Link to={`/markets/${position.marketId}`} className="font-display text-base font-medium text-fg hover:text-accent">
          {title}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {position.stakes.map((s) => (
            <span
              key={s.teamId}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 h-7 text-xs text-fg-muted"
            >
              <Flag teamId={s.teamId} size="sm" />
              {s.name}
              <span className="font-mono tabular-nums text-fg-subtle">{s.stakeBnb.toFixed(4)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {position.claimableBnb > 0 && (
          <div className="text-right">
            <Badge intent="success" size="sm">
              {t('betting.status.resolved')}
            </Badge>
            <p className="mt-1 font-mono text-sm text-success">+{position.claimableBnb.toFixed(4)} BNB</p>
          </div>
        )}
        {position.claimableBnb > 0 ? (
          <Button intent="primary" size="sm" disabled={busy} onClick={onClaim}>
            {t('betting.claim')}
          </Button>
        ) : position.refundableBnb > 0 ? (
          <Button intent="secondary" size="sm" disabled={busy} onClick={onRefund}>
            {t('betting.refund')}
          </Button>
        ) : (
          <span className="font-mono text-sm text-fg-muted">{position.totalStakeBnb.toFixed(4)} BNB</span>
        )}
      </div>
    </Card>
  );
}
