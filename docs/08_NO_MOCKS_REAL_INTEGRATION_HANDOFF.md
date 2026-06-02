# No-mocks handoff: real integrations required

This app intentionally does not show fake odds, fake probabilities, fake balances, fake bet history, fake win/loss records, fake PnL, fake liquidity, or fake live betting metrics.

## Current honest public states

- Privy auth and embedded wallet can be enabled with `VITE_PRIVY_APP_ID` and optional `VITE_PRIVY_CLIENT_ID`.
- BSC is the configured wallet chain (`chainId: 56`).
- Bet slip, deposits, withdrawals, ticket history, balances, PnL, and payout/settlement UX remain disabled.
- Market rows are labeled preview fixtures only and are not user account data or live market data.

## Required before real betting can go live

1. Deployed production Flap vault address
   - Add as `VITE_FLAP_VAULT_ADDRESS` only after deployment/review.
   - Confirm public contract methods for deposit/bet/withdraw/settle and schema reads.

2. Stake/payment token address
   - Add as `VITE_STAKE_TOKEN_ADDRESS` after the token route is approved.
   - Confirm decimals, approvals, transfer route, minimum stake, and refund rules.

3. BSC RPC and transaction client
   - Add a safe public RPC as `VITE_BSC_RPC_URL` if the frontend needs read access.
   - Keep any operator/private signer server-only.

4. Event indexer
   - Add `VITE_INDEXER_URL` or backend endpoint only after it reads real vault events.
   - Needed events: deposits, bets/tickets, withdrawals, market close, result resolution, settlements, refunds.

5. Market metadata source
   - Real market ids, titles, match mappings, `matchStartTime`, `bettingCloseTime`, `settlementEarliestTime`, and status.
   - WorldCupViewer/result source mapping must be confirmed before settlement copy claims finality.

6. Backend/Supabase if needed
   - Store only derived public/user-safe views; do not store private wallet keys or server secrets in frontend env.
   - If user profiles/history are shown, source them from authenticated backend/indexer reads, not fixtures.

7. Product/review gates
   - Explicit risk copy, disabled-to-enabled bet transition, transaction confirmation copy, and operator settlement policy.
   - Legal/compliance review for any real-money betting UX.

## Fixture policy

Preview fixtures may remain only to preserve layout while real data is absent. They must be labeled as preview fixtures and must not include fake odds, fake probabilities, fake balances, fake win/loss, fake PnL, or fake user history.
