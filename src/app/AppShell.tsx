import { useState } from 'react';
import { BETTING_VAULT_ADDRESS } from '../lib/env';
import { marketFixtures } from '../data/markets';
import type { MarketFixture, Outcome, Pick } from '../features/markets/types';
import { ConnectWalletButton } from '../features/wallet/WalletButton';
import { WalletPanel } from '../features/wallet/WalletPanel';
import { BettingSlip } from '../features/betting/BettingSlip';

function isoCodeFromFlagEmoji(flag: string) {
  const regionalIndicators = Array.from(flag).filter((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
  });
  if (regionalIndicators.length !== 2) return null;
  return regionalIndicators
    .map((character) => String.fromCharCode((character.codePointAt(0) ?? 0) - 0x1f1e6 + 97))
    .join('');
}

function flagImageCode(outcome: Outcome) {
  const manualCodes: Record<string, string> = {
    England: 'gb-eng',
    Scotland: 'gb-sct',
  };
  return manualCodes[outcome.name] ?? isoCodeFromFlagEmoji(outcome.flag);
}

function FlagIcon({ outcome }: { outcome: Outcome }) {
  if (outcome.teamId === 50 || outcome.name === 'Draw') {
    return (
      <span className="countryFlag symbolic" aria-label="Draw">
        <span>↔</span>
      </span>
    );
  }
  const code = flagImageCode(outcome);
  const src = code ? `https://flagcdn.com/w80/${code}.png` : '';
  return (
    <span className="countryFlag" aria-label={`${outcome.name} flag`}>
      {src ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{outcome.flag}</span>}
    </span>
  );
}

export function AppShell({ configReady }: { configReady: boolean }) {
  const [pick, setPick] = useState<Pick | null>(null);
  const [activeType, setActiveType] = useState<MarketFixture['type']>('Match Winner');
  const liveReady = Boolean(configReady && BETTING_VAULT_ADDRESS);
  const marketTypes: Array<{ type: MarketFixture['type']; label: string; helper: string }> = [
    { type: 'Match Winner', label: 'Matches', helper: '1 / X / 2 rows for every listed game' },
    { type: 'Group Winner', label: 'Groups', helper: 'Group A-L winner markets' },
    { type: 'Tournament Winner', label: 'Tournament', helper: 'One outright board, compact and scrollable' },
  ];
  const activeMarkets = marketFixtures.filter((market) => market.type === activeType);
  const activeCopy = marketTypes.find((item) => item.type === activeType)?.helper;

  function chooseMarketType(type: MarketFixture['type']) {
    setActiveType(type);
  }

  return (
    <>
      <nav className="nav">
        <a className="brand" href="#top">
          <span className="mark">PF</span>
          <span>PolyFlap</span>
        </a>
        <div className="navlinks">
          <a href="#markets">Markets</a>
          <a href="#wallet">Wallet</a>
        </div>
        <ConnectWalletButton configReady={configReady} />
      </nav>

      <main id="top" className="shell">
        <section className="hero">
          <div>
            <div className="pill redPill">World Cup prediction markets on Flap</div>
            <h1>PolyFlap</h1>
            <p className="lead">
              PolyFlap is a World Cup-only prediction market app for Flap. Pick an outcome, connect a BSC wallet
              through Privy, buy a position with BNB, and sell/withdraw your open stake before the market closes.
              Results are settled from Flap WorldCupViewer data.
            </p>
            <div className="heroActions">
              <a className="btn primary" href="#markets">
                View markets
              </a>
              <a className="btn" href="#wallet">
                Create wallet
              </a>
            </div>
            <div className="facts">
              <div className="fact">
                <b>{liveReady ? 'Live' : 'Preview'}</b>
                <span>betting vault</span>
              </div>
              <div className="fact">
                <b>{marketFixtures.length}</b>
                <span>markets</span>
              </div>
              <div className="fact">
                <b>3</b>
                <span>market categories</span>
              </div>
              <div className="fact">
                <b>Buy / Sell</b>
                <span>pre-close exit</span>
              </div>
            </div>
          </div>
          <WalletPanel configReady={configReady} />
        </section>

        <section id="markets">
          <div className="sectionHead">
            <h2>Markets by category.</h2>
            <p>
              Nothing is mixed together now: match winners, group winners, and the tournament outright live in separate
              sportsbook-style tabs. The betting buttons still use the same marketId, viewerMatchId and teamId data.
            </p>
          </div>
          <div className="marketConsole">
            <div className="marketTabs" role="tablist" aria-label="Market categories">
              {marketTypes.map((item) => {
                const count = marketFixtures.filter((market) => market.type === item.type).length;
                return (
                  <button
                    className={`marketTab ${activeType === item.type ? 'active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={activeType === item.type}
                    key={item.type}
                    onClick={() => chooseMarketType(item.type)}
                  >
                    <span>{item.label}</span>
                    <b>{count}</b>
                    <small>{item.helper}</small>
                  </button>
                );
              })}
            </div>
            <div className="marketSummary">
              <div>
                <span>Showing</span>
                <b>
                  {activeMarkets.length} {activeType.toLowerCase()} market{activeMarkets.length === 1 ? '' : 's'}
                </b>
              </div>
              <div>
                <span>Settlement</span>
                <b>
                  {activeType === 'Tournament Winner'
                    ? 'getWorldCupWinner()'
                    : activeType === 'Group Winner'
                      ? 'getGroupMatchWinners()'
                      : 'getMatchResult()'}
                </b>
              </div>
            </div>
          </div>
          <div className="marketLayout">
            <div>
              <div className="marketModeHeader">
                <span>{activeType}</span>
                <p>{activeCopy}</p>
              </div>
              <div
                className={`marketBoard ${
                  activeType === 'Tournament Winner'
                    ? 'outrightBoard'
                    : activeType === 'Group Winner'
                      ? 'groupBoard'
                      : 'matchBoard'
                }`}
              >
                {activeMarkets.map((market) => (
                  <article
                    className={`marketCard ${
                      activeType === 'Tournament Winner'
                        ? 'outrightCard'
                        : activeType === 'Group Winner'
                          ? 'groupCard'
                          : 'matchCard'
                    }`}
                    key={market.marketId}
                  >
                  <div className="marketTop">
                    <span>WorldCupViewer M{market.viewerMatchId}</span>
                    <span>{market.type}</span>
                  </div>
                  <div className="marketTitle">
                    <h3>{market.title}</h3>
                    <p>{market.close}</p>
                  </div>
                  <div
                    className={`outcomeGrid ${
                      activeType === 'Tournament Winner'
                        ? 'outrightGrid'
                        : activeType === 'Match Winner'
                          ? 'matchOddsGrid'
                          : ''
                    }`}
                  >
                    {market.outcomes.map((outcome) => (
                      <button
                        className={`betBtn ${
                          pick?.market.marketId === market.marketId && pick.outcome.teamId === outcome.teamId
                            ? 'selected'
                            : ''
                        }`}
                        type="button"
                        key={`${market.marketId}-${outcome.teamId}`}
                        onClick={() => setPick({ market, outcome })}
                      >
                        <span className="outcomeMain">
                          <FlagIcon outcome={outcome} />
                          <span>{outcome.name}</span>
                        </span>
                        <small>
                          {activeType === 'Match Winner' && outcome.name === 'Draw'
                            ? 'Draw · teamId 50'
                            : `teamId ${outcome.teamId}`}
                        </small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
              </div>
            </div>
            <BettingSlip pick={pick} configReady={configReady} />
          </div>
        </section>

        <section id="wallet">
          <div className="sectionHead">
            <h2>Wallet.</h2>
            <p>
              Connect with Privy, use a BSC-capable wallet, and sign buy or sell transactions directly from the order
              ticket.
            </p>
          </div>
          <WalletPanel configReady={configReady} />
        </section>
      </main>
    </>
  );
}
