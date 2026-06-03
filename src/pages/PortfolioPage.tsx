import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Card } from '../components/ui';
import { isPrivyConfigured } from '../lib/env';

export function PortfolioPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-medium text-fg sm:text-4xl">{t('nav.portfolio')}</h1>
        <p className="text-fg-muted">Your active bets, claimable winnings, and refunds.</p>
      </header>

      <Card variant="default" padding="lg" className="mt-8">
        {isPrivyConfigured ? <ConnectedPortfolio /> : <DisconnectedView />}
      </Card>

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
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="max-w-sm text-fg-muted">
        Connect your wallet to see your positions across all World Cup markets.
      </p>
      <Button intent="secondary" disabled>
        {t('wallet.connect')}
      </Button>
    </div>
  );
}

function ConnectedPortfolio() {
  const { t } = useTranslation();
  const { authenticated, login } = usePrivy();

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="max-w-sm text-fg-muted">
          Connect your wallet to see your positions across all World Cup markets.
        </p>
        <Button intent="primary" onClick={login}>
          {t('wallet.connect')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="max-w-sm text-fg-muted">
        On-chain position reading lands next. Your bets, claims, and refunds will appear here.
      </p>
    </div>
  );
}
