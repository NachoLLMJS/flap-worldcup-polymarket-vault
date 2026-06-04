import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flag } from '../../components/Flag';
import { CountUp } from '../../components/CountUp';
import { useMarkets } from '../../features/markets/useMarkets';
import { marketKind } from '../../features/markets/types';

/** "Matchday Board" — a dense, broadcast-style sportsbook board. No centered
 *  landing hero; instead a live scoreboard strip + a featured-match panel and
 *  an odds-board list. Monospace-forward, hairline grid, LED energy. */
export function HomeBoard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const zh = i18n.resolvedLanguage?.startsWith('zh');
  const markets = useMarkets();

  const tournament = markets.find((m) => marketKind(m.type) === 'tournament') ?? markets[0];
  const matches = markets.filter((m) => marketKind(m.type) === 'match').slice(0, 10);
  const groups = markets.filter((m) => marketKind(m.type) === 'group').slice(0, 6);

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-5">
      {/* Top status strip */}
      <div className="flex items-center justify-between border-b border-border-subtle py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-subtle">
        <span className="flex items-center gap-2 text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live board
        </span>
        <span className="hidden sm:block">World Cup 2026 · BNB Chain · pari-mutuel</span>
        <span>{markets.length} markets</span>
      </div>

      {/* Board grid: featured panel + odds list */}
      <div className="grid grid-cols-1 gap-4 py-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Featured: tournament winner as a big board */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-bg-elevated">
          <img src="/hero/hero-1280.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
          <div className="relative flex items-center justify-between border-b border-border-subtle/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-accent">
            <span>★ Featured · Outright</span>
            <span className="text-fg-subtle">M{tournament.viewerMatchId}</span>
          </div>
          <div className="relative px-4 pb-4 pt-10">
            <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-fg sm:text-4xl">
              {zh ? tournament.zhTitle : tournament.title}
            </h1>
            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {tournament.outcomes.slice(0, 8).map((o) => (
                <button
                  key={o.teamId}
                  onClick={() => navigate(`/markets/${tournament.marketId}`)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-bg/60 px-2 py-1.5 text-left text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  <Flag teamId={o.teamId} size="sm" />
                  <span className="truncate">{zh ? o.zh : o.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.08em] text-fg-subtle">
              <span><CountUp to={tournament.outcomes.length} className="text-fg" /> teams</span>
              <Link to={`/markets/${tournament.marketId}`} className="text-accent hover:underline">
                Open market →
              </Link>
            </div>
          </div>
        </section>

        {/* Odds-board list of matches */}
        <section className="overflow-hidden rounded-lg border border-border bg-bg-elevated">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-subtle">
            <span>Match winners</span>
            <Link to="/markets" className="text-accent hover:underline">All →</Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {matches.map((m) => (
              <Link
                key={m.marketId}
                to={`/markets/${m.marketId}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-higher"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {m.outcomes.slice(0, 2).map((o) => (
                    <Flag key={o.teamId} teamId={o.teamId} size="sm" />
                  ))}
                  <span className="truncate text-sm text-fg">{zh ? m.zhTitle : m.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {m.outcomes.slice(0, 3).map((o, i) => (
                    <span
                      key={o.teamId}
                      className="rounded border border-border bg-bg px-2 py-1 font-mono text-[11px] tabular-nums text-fg-muted"
                    >
                      {i === 2 ? 'X' : (zh ? o.zh : o.name).slice(0, 3).toUpperCase()}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Groups row */}
      <section className="pb-12">
        <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-subtle">
          <span>Group winners</span>
          <span>1% fee · winner takes the pool</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {groups.map((g) => (
            <Link
              key={g.marketId}
              to={`/markets/${g.marketId}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated p-3 transition-colors hover:border-accent"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-info">{zh ? g.zhTitle : g.title}</span>
              <div className="flex -space-x-1.5">
                {g.outcomes.slice(0, 4).map((o) => (
                  <span key={o.teamId} className="ring-2 ring-bg-elevated">
                    <Flag teamId={o.teamId} size="sm" className="rounded-full" />
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Fee strip */}
      <div className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {[
          ['85', 'markets'],
          ['1%', 'platform fee'],
          ['BNB', 'native stake'],
          ['Pari-mutuel', 'payout'],
        ].map(([v, l]) => (
          <div key={l} className="bg-bg-elevated px-4 py-5">
            <div className="font-display text-2xl font-semibold text-fg">{v}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-fg-subtle">{l}</div>
          </div>
        ))}
      </div>
      <p className="sr-only">{t('brand.tagline')}</p>
    </div>
  );
}
