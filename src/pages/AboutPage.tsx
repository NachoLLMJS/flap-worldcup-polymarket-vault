import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui';
import { FEE_WALLET } from '../lib/env';
import { vaultSchemaRows } from '../data/vaultSchema';

const CONTRACTS = [
  { label: 'Betting Vault', address: '0x2c194de4fc820128044b4b405a5e8e5bd1e91358' },
  { label: 'Flap Vault', address: '0xf8a204353ee286c1a98776efb35510d4e489e57f' },
  { label: 'WorldCupViewer', address: '0x00036192958C2aaAF9F445d3Cdc2979995EA333e' },
  { label: 'Fee recipient', address: FEE_WALLET },
];

function bscScan(address: string) {
  return `https://bscscan.com/address/${address}`;
}

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Transparency</span>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl">
          How fees &amp; <span className="font-editorial font-light italic text-gold">settlement</span> work
        </h1>
        <p className="text-fg-muted">Transparent by design. No hidden spread, no bookmaker margin.</p>
      </header>

      <section className="mt-8 flex flex-col gap-4">
        <Card variant="default" padding="lg">
          <h2 className="font-display text-xl font-medium text-fg">The 1% platform fee</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{t('betting.feeNote')}</p>
          <div className="mt-4 rounded-lg border border-border-subtle bg-bg p-4 font-mono text-sm">
            <div className="flex justify-between text-fg-muted">
              <span>Bet 1 BNB</span>
              <span>=</span>
            </div>
            <div className="mt-2 flex justify-between text-fg">
              <span>→ Platform fee</span>
              <span>0.01 BNB</span>
            </div>
            <div className="flex justify-between text-fg">
              <span>→ Market pool</span>
              <span>0.99 BNB</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">{t('betting.withdrawNote')}</p>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="font-display text-xl font-medium text-fg">Pari-mutuel payouts</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Every stake on every outcome forms one shared pool. When Flap WorldCupViewer resolves the result, winners
            split the entire pool proportionally to their net stake. If a market is cancelled, you can claim a full
            refund of your stakes. Settlement is permissionless — anyone can trigger it once results are final.
          </p>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="font-display text-xl font-medium text-fg">On-chain contracts</h2>
          <p className="mt-3 text-sm text-fg-muted">Everything is verifiable on BscScan.</p>
          <div className="mt-4 flex flex-col divide-y divide-border-subtle">
            {CONTRACTS.map((c) => (
              <a
                key={c.address}
                href={bscScan(c.address)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 py-3 hover:text-accent"
              >
                <span className="text-sm text-fg">{c.label}</span>
                <span className="font-mono text-xs text-fg-subtle">
                  {c.address.slice(0, 8)}…{c.address.slice(-6)}
                </span>
              </a>
            ))}
          </div>
        </Card>

        <Card variant="ghost" padding="lg" className="border border-border-subtle">
          <h2 className="font-display text-lg font-medium text-fg">Flap vault surface</h2>
          <p className="mt-2 text-sm text-fg-subtle">
            The project runs a custom Flap vault that exposes World Cup data and treasury functions to Flap.
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            {vaultSchemaRows.map(([method, desc]) => (
              <div key={method} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <code className="font-mono text-xs text-accent">{method}</code>
                <span className="text-xs text-fg-subtle">{desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
