import { useState } from 'react';
import { BETTING_VAULT_ADDRESS } from '../lib/env';
import { marketFixtures } from '../data/markets';
import type { Pick } from '../features/markets/types';
import { ConnectWalletButton } from '../features/wallet/WalletButton';
import { WalletPanel } from '../features/wallet/WalletPanel';
import { BettingSlip } from '../features/betting/BettingSlip';

export function AppShell({ configReady }: { configReady: boolean }) {
  const [pick, setPick] = useState<Pick | null>(null);
  const liveReady = Boolean(configReady && BETTING_VAULT_ADDRESS);

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
                Connect wallet
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
                <b>BSC</b>
                <span>native BNB</span>
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
            <h2>World Cup markets.</h2>
            <p>
              85 markets from the current WorldCupViewer reference data: tournament winner, Group A-L winners, and
              every listed match winner. Settlement uses <code>getWorldCupWinner()</code>,{' '}
              <code>getGroupMatchWinners()</code>, or <code>getMatchResult()</code>.
            </p>
          </div>
          <div className="marketLayout">
            <div className="marketBoard">
              {marketFixtures.map((market) => (
                <article className="marketCard" key={market.marketId}>
                  <div className="marketTop">
                    <span>WorldCupViewer M{market.viewerMatchId}</span>
                    <span>{market.type}</span>
                  </div>
                  <div className="marketTitle">
                    <h3>{market.title}</h3>
                    <p>{market.close}</p>
                  </div>
                  <div className="outcomeGrid">
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
                          <span className="countryFlag">{outcome.flag}</span>
                          <span>{outcome.name}</span>
                        </span>
                        <small>teamId {outcome.teamId}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
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
