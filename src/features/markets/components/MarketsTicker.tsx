import { Link } from 'react-router-dom';
import { useMarkets } from '../useMarkets';

/** Honest live-feel ticker: a seamless marquee of real open markets. Gives the
 *  page a pulse without faking on-chain activity. */
export function MarketsTicker() {
  const markets = useMarkets();
  const items = markets.slice(0, 24);
  const row = [...items, ...items]; // duplicated for seamless loop

  return (
    <div className="relative overflow-hidden border-y border-border-subtle bg-bg-elevated/40 py-3 backdrop-blur-sm">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />
      <div className="fw-marquee flex w-max items-center gap-8">
        {row.map((m, i) => (
          <Link
            key={`${m.marketId}-${i}`}
            to={`/markets/${m.marketId}`}
            className="group flex shrink-0 items-center gap-2.5 text-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-success">Open</span>
            <span className="text-fg-muted transition-colors group-hover:text-fg">{m.title}</span>
            <span className="font-mono text-[11px] text-fg-subtle">{m.outcomes.length} outcomes</span>
            <span className="text-border-strong">·</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
