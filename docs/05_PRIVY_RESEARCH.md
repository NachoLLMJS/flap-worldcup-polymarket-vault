# Privy research: Google login + embedded wallet architecture

## Goal

Use Privy so a user can sign in with Google/Gmail, receive an embedded EVM wallet inside the app, fund that wallet, and use it to interact with the World Cup Flap vault on BSC.

This document is intentionally scoped to authentication and wallet architecture. It does not change the public UI and it does not claim that the BSC Flap vault can directly trade or settle Polymarket positions. The current product thesis remains: BSC settlement and vault interaction through Flap; Polymarket fields are metadata/off-chain execution unless a later audited executor is designed.

## Privy docs read

Primary docs checked on 2026-06-02:

- React SDK installation: https://docs.privy.io/basics/react/installation.md
- React `PrivyProvider` setup: https://docs.privy.io/basics/react/setup.md
- Configure login methods in Dashboard: https://docs.privy.io/basics/get-started/dashboard/configure-login-methods.md
- OAuth / Google login: https://docs.privy.io/authentication/user-authentication/login-methods/oauth.md
- Automatic wallet creation: https://docs.privy.io/basics/react/advanced/automatic-wallet-creation.md
- Embedded wallets overview: https://docs.privy.io/wallets/overview/embedded.md
- Create wallet: https://docs.privy.io/wallets/wallets/create/create-a-wallet.md
- Get connected wallets: https://docs.privy.io/wallets/wallets/get-a-wallet/get-connected-wallet.md
- Configure EVM networks: https://docs.privy.io/basics/react/advanced/configuring-evm-networks.md
- Switch chain: https://docs.privy.io/wallets/using-wallets/ethereum/switch-chain.md
- Ethereum/EVM transaction sending: https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction.md
- Web3 library integrations: https://docs.privy.io/wallets/using-wallets/ethereum/web3-integrations.md
- viem integration: https://docs.privy.io/wallets/connectors/ethereum/integrations/viem.md
- ethers integration: https://docs.privy.io/wallets/connectors/ethereum/integrations/ethers.md
- Funding overview: https://docs.privy.io/wallets/funding/overview.md
- Funding configuration: https://docs.privy.io/wallets/funding/configuration.md
- Chain support: https://docs.privy.io/wallets/overview/chains.md
- Security overview: https://docs.privy.io/security/overview.md
- Security checklist: https://docs.privy.io/security/implementation-guide/security-checklist.md
- Allowed domains: https://docs.privy.io/recipes/react/allowed-domains.md
- Wallet MFA: https://docs.privy.io/authentication/user-authentication/mfa/overview.md

## High-level architecture

Recommended flow for this project:

1. Create a Privy app in the Privy Dashboard.
2. Enable Google OAuth as a login method in the Dashboard.
3. Add the production domain and local development origin to Privy's allowed origins / OAuth redirect settings as appropriate.
4. Install `@privy-io/react-auth` in the React app once a real frontend is added.
5. Wrap the React app in `PrivyProvider` with:
   - `appId` from a public frontend env var such as `VITE_PRIVY_APP_ID`.
   - optional `clientId` if using Privy app clients for per-environment behavior.
   - `defaultChain: bsc` and `supportedChains: [bsc]` if the first product is BSC-only.
   - `embeddedWallets.ethereum.createOnLogin: 'users-without-wallets'` so new Google users get an embedded EVM wallet.
6. On login, find or create the user's embedded wallet.
7. Before any vault action, switch the wallet to BSC chain ID `56`.
8. Use viem or ethers with the wallet's EIP-1193 provider to encode and submit calls to `WorldCupPolymarketVault`.
9. Keep funding UX explicit: users need BNB for gas and potentially BNB/native value for vault functions that use `msg.value`. If a later executor touches Polymarket, that is a separate Polygon/USDC custody problem, not the BSC embedded-wallet flow.

## Dashboard setup

### App creation

Create a Privy app in the Dashboard and copy the app ID. For a Vite app, expose only the app ID to the browser:

```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_PRIVY_CLIENT_ID=optional_environment_client_id
```

Do not expose these in frontend code:

```env
PRIVY_APP_SECRET=server_only
PRIVY_AUTHORIZATION_PRIVATE_KEY=server_only_if_using_authorization_keys
```

The app ID is designed for client-side use, but production access should be restricted with allowed domains.

### Login methods

In the Privy Dashboard, enable Google under social/OAuth login methods. The product can label this as Gmail login in user-facing copy, but technically it is Google OAuth; the email may be a Gmail address or another Google-account email.

Important Google limitation from Privy docs: Google OAuth may not work in in-app browsers embedded in social apps because of Google's restrictions. For mobile/social traffic, route users to a normal browser flow or provide a fallback login method such as email OTP.

### Allowed origins and redirect URLs

For production, configure allowed domains in the Privy Dashboard:

- Add the exact production origin.
- Add both apex and `www` domains if both are used.
- Avoid generic preview wildcards such as `*.vercel.app` for a production app ID.
- `localhost` is supported only with an explicit port, but should not remain on a production app ID unless intentionally using a separate dev app/client.
- Configure allowed OAuth redirect URLs so OAuth cannot redirect users to arbitrary domains.

For this project, a clean split is:

- Development Privy app or app client: `http://localhost:5173` or the eventual local dev port.
- Production Privy app or app client: only the final deployed domain.

## React installation

Privy docs require React 18+ and TypeScript 5+ for the React SDK.

Install once the frontend becomes a real React/Vite app:

```bash
npm install @privy-io/react-auth@latest
npm install viem
```

`viem` is recommended here because the project already needs typed EVM chain configuration and contract calls. `ethers` also works if the rest of the app prefers it.

## PrivyProvider configuration for BSC

Privy docs say embedded wallets can support any EVM-compatible chain, and the EVM-network guide exposes `defaultChain` and `supportedChains`:

- `defaultChain`: primary network wallets should use.
- `supportedChains`: networks wallets are permitted to use; this is a guardrail against accidental wrong-network actions.

BSC is EVM-compatible. In viem, BNB Smart Chain is available as `bsc` with chain ID `56`.

Recommended provider for a BSC-only Flap vault app:

```tsx
import {PrivyProvider} from '@privy-io/react-auth';
import {bsc} from 'viem/chains';

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      clientId={import.meta.env.VITE_PRIVY_CLIENT_ID}
      config={{
        defaultChain: bsc,
        supportedChains: [bsc],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

If Privy's default RPC provider is not enough for production traffic, override BSC's RPC URL using Privy's documented `addRpcUrlOverrideToChain` helper from `@privy-io/chains`, or define/override the chain with a dedicated BSC RPC provider. The Privy docs warn that default RPC providers are subject to rate limits and recommend setting up your own provider as the app scales.

## Google/Gmail login implementation

Two acceptable UI patterns:

### Privy modal

Use Privy's built-in login modal and configure Google as an enabled provider in the Dashboard. This is the fastest product path.

### Custom Google button

Privy documents `useLoginWithOAuth` for custom OAuth buttons:

```tsx
import {useLoginWithOAuth} from '@privy-io/react-auth';

export function LoginWithGoogleButton() {
  const {loading, initOAuth} = useLoginWithOAuth({
    onComplete: ({user, isNewUser}) => {
      console.log('Privy login complete', user.id, {isNewUser});
    },
    onError: (error) => {
      console.error('Privy Google login failed', error);
    },
  });

  return (
    <button onClick={() => initOAuth({provider: 'google'})} disabled={loading}>
      {loading ? 'Logging in...' : 'Continue with Google'}
    </button>
  );
}
```

Product note: show "Continue with Google" rather than "Gmail wallet". The wallet is created by Privy after auth; Gmail is just the identity method.

## Embedded wallet creation

Privy supports both automatic and manual wallet creation.

### Recommended: automatic wallet creation

For this app, automatic wallet creation is best because the user should be able to enter the product through Google and immediately see a ready embedded wallet. Configure:

```tsx
embeddedWallets: {
  ethereum: {
    createOnLogin: 'users-without-wallets',
  },
}
```

Privy docs state this creates an Ethereum/EVM embedded wallet for users who do not already have one when they log in via the Privy modal. It avoids creating duplicates for returning users.

### Manual fallback

If the custom OAuth button or an edge case does not create a wallet automatically, use `useCreateWallet`:

```tsx
import {useCreateWallet, useWallets} from '@privy-io/react-auth';

export function EnsureEmbeddedWalletButton() {
  const {ready, wallets} = useWallets();
  const {createWallet} = useCreateWallet();

  const hasEmbeddedEvmWallet = wallets.some(
    (wallet) => wallet.walletClientType === 'privy' && wallet.chainType === 'ethereum',
  );

  return (
    <button
      disabled={!ready || hasEmbeddedEvmWallet}
      onClick={() => createWallet()}
    >
      {hasEmbeddedEvmWallet ? 'Wallet ready' : 'Create embedded wallet'}
    </button>
  );
}
```

Implementation detail: `useWallets` returns connected wallets. Wait for its `ready` boolean before assuming a user does or does not have an embedded wallet, because Privy loads embedded-wallet key material through an iframe.

## Wallet selection and BSC switching

Before a vault transaction, find the embedded EVM wallet and switch it to BSC:

```tsx
import {useWallets} from '@privy-io/react-auth';
import {bsc} from 'viem/chains';

function useBscEmbeddedWallet() {
  const {ready, wallets} = useWallets();

  const wallet = wallets.find(
    (candidate) =>
      candidate.walletClientType === 'privy' && candidate.chainType === 'ethereum',
  );

  async function ensureBsc() {
    if (!ready) throw new Error('Privy wallets are not ready yet');
    if (!wallet) throw new Error('No embedded EVM wallet found for this user');
    await wallet.switchChain(bsc.id); // 56
    return wallet;
  }

  return {ready, wallet, ensureBsc};
}
```

Privy's switch-chain docs say:

- For embedded wallets, `switchChain` updates the embedded wallet network behind the scenes.
- For external wallets, it prompts the user in their external wallet client.
- The switch fails if the target chain is not configured in `supportedChains`.

For a BSC-only MVP, do not allow vault transactions unless `wallet.switchChain(56)` succeeds.

## viem integration for vault calls

Privy exposes an EIP-1193 provider through `wallet.getEthereumProvider()`. Privy's viem docs show passing that provider into viem's `custom` transport and `createWalletClient`.

Example contract-write skeleton:

```tsx
import {createWalletClient, custom, parseEther} from 'viem';
import {bsc} from 'viem/chains';

const WORLD_CUP_VAULT_ADDRESS = '0x...';
const WORLD_CUP_VAULT_ABI = [
  // Add ABI entries from contracts/WorldCupPolymarketVault.sol once deployed.
] as const;

async function refreshSettlementWithViem(wallet: any, matchId: bigint) {
  await wallet.switchChain(bsc.id);

  const provider = await wallet.getEthereumProvider();
  const client = createWalletClient({
    chain: bsc,
    transport: custom(provider),
  });

  const [account] = await client.getAddresses();

  return client.writeContract({
    account,
    address: WORLD_CUP_VAULT_ADDRESS,
    abi: WORLD_CUP_VAULT_ABI,
    functionName: 'refreshSettlement',
    args: [matchId],
  });
}
```

For read-only vault calls, prefer a normal public viem client using a BSC RPC URL. Do not require a Privy wallet just to read `description()`, `getMarkets(...)`, or `WorldCupViewer` state.

```tsx
import {createPublicClient, http} from 'viem';
import {bsc} from 'viem/chains';

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(import.meta.env.VITE_BSC_RPC_URL),
});
```

`VITE_BSC_RPC_URL` can be public if it is a browser-safe RPC key/URL, but avoid exposing privileged RPC endpoints or any provider secret that can mutate account settings.

## ethers integration alternative

Privy's ethers docs say to get the EIP-1193 provider from the wallet and wrap it in ethers.

Ethers v6 skeleton:

```tsx
import {BrowserProvider, Contract} from 'ethers';
import {bsc} from 'viem/chains';

async function refreshSettlementWithEthers(wallet: any, matchId: bigint) {
  await wallet.switchChain(bsc.id);

  const eip1193Provider = await wallet.getEthereumProvider();
  const provider = new BrowserProvider(eip1193Provider);
  const signer = await provider.getSigner();

  const vault = new Contract(WORLD_CUP_VAULT_ADDRESS, WORLD_CUP_VAULT_ABI, signer);
  return vault.refreshSettlement(matchId);
}
```

Use either viem or ethers, not both, unless there is a clear reason.

## Funding the embedded wallet

The user must have assets in the embedded wallet before sending BSC transactions:

- BNB for gas.
- BNB/native value if calling any vault method that requires `msg.value`.
- Potentially other tokens only if future vault methods add approvals/spending.

Privy funding docs support several wallet-funding paths:

1. Fiat-to-crypto onramps through providers such as Meld, MoonPay, and Coinbase.
2. Bank deposits through supported providers.
3. Crypto deposit addresses, where a user sends crypto from another chain/wallet/exchange and the provider can bridge/swap into the destination wallet.

Important limitations and product implications:

- Card/fiat onramps are mainnet-only; testnets cannot receive testnet tokens through card onramps.
- Provider and asset support varies. Confirm whether BNB on BSC is supported before promising one-click BNB funding.
- Onramps can take minutes to days depending on payment method/provider checks.
- If BNB-on-BSC onramp support is weak, the MVP should show a simple deposit address and instructions: send BNB on BSC to the embedded wallet address.
- Do not show fake balances or fake funding status. Show "not funded" / "needs BNB gas" when appropriate.

Suggested funding UX:

1. After Google login, show embedded wallet address.
2. Read BSC native balance via `eth_getBalance` / viem public client.
3. If balance is below a gas threshold, show `Fund wallet`.
4. Offer Privy funding flow only for supported mainnet assets/providers.
5. Always include a manual BSC deposit-address fallback.

## How this maps to the Flap vault

The Privy wallet is the user's app wallet. It can:

- Send BSC transactions to the deployed `WorldCupPolymarketVault`.
- Pay BSC gas with BNB.
- Call permissionless write methods if the contract exposes any.
- Sign/submit permissioned writes only if the wallet is an authorized operator; most normal users should not be able to call operator/Guardian-only functions such as market curation.

The Privy wallet should not be described as a Polymarket trading wallet in this MVP because:

- Polymarket is not BSC-native.
- The current vault stores Polymarket market metadata only.
- Any real Polymarket order placement, USDC custody, claiming, or bridge/executor flow is a separate architecture and audit scope.

## Security and environment notes

### Frontend-safe values

Safe for frontend build-time env:

```env
VITE_PRIVY_APP_ID=...
VITE_PRIVY_CLIENT_ID=...
VITE_BSC_RPC_URL=browser_safe_rpc_url_only
```

### Server-only values

Never commit or expose:

```env
PRIVY_APP_SECRET=...
PRIVY_AUTHORIZATION_PRIVATE_KEY=...
RPC_PROVIDER_ADMIN_SECRET=...
PRIVATE_WALLET_KEY=...
```

Privy's REST/server-wallet API examples use app ID + app secret and, for protected server-controlled wallets, authorization signatures. Those belong only in server routes, GitHub Actions secrets, or secure backend infrastructure.

### Required production hardening

- Restrict allowed domains for the production app ID.
- Configure allowed OAuth redirect URLs.
- Use separate app clients or apps for local/dev/staging/prod.
- Enable HttpOnly cookies after verifying domain ownership if the deployment model supports it.
- Add a strong Content Security Policy; Privy's checklist explicitly calls out limiting unintended JavaScript injection.
- Offer or require wallet MFA as value increases. Privy wallet MFA requires extra verification for embedded-wallet signing and currently supports SMS, TOTP, and passkeys.
- For high-value betting/vault flows, require explicit transaction review screens before `writeContract` / `sendTransaction`.
- Never auto-submit a vault/bet transaction immediately after Google login. Authentication and wallet creation are not consent to transact.

## Limitations / decisions for this product

1. Google login is identity, not custody proof. The user still needs to approve wallet actions.
2. Embedded wallets are self-custodial in Privy's model, backed by TEEs/key sharding, but the app remains responsible for safe UX, domain security, and transaction clarity.
3. BSC is EVM-compatible and can be configured in Privy, but provider/funding support must be validated before promising frictionless BNB purchase.
4. A BSC-only `supportedChains: [bsc]` configuration is safest for the Flap MVP. If later adding Base/Polygon for other flows, explicitly separate those flows in UI and code.
5. Read operations should not require a wallet; only write/signing operations should.
6. The embedded wallet does not solve Polymarket's separate chain/custody/USDC/orderbook problem.
7. Operator/Guardian vault functions must remain permissioned at the contract layer; Privy auth alone is not authorization to mutate vault metadata.
8. If the app uses preview deployments, do not reuse the production Privy app ID with broad preview wildcards.
9. If using custom Google OAuth UI, test the automatic wallet creation path; Privy docs note automatic creation applies to login through the Privy modal, so a custom flow may need a manual `useCreateWallet` fallback.

## Implementation checklist for the future frontend task

- [ ] Create Privy app/client for local and production.
- [ ] Enable Google OAuth login.
- [ ] Configure allowed origins and OAuth redirect URLs.
- [ ] Install `@privy-io/react-auth` and `viem`.
- [ ] Add `PrivyProvider` at app root.
- [ ] Configure `defaultChain: bsc` and `supportedChains: [bsc]`.
- [ ] Configure `embeddedWallets.ethereum.createOnLogin: 'users-without-wallets'`.
- [ ] Add login button/modal.
- [ ] Show wallet readiness using `useWallets().ready`.
- [ ] Ensure an embedded EVM wallet exists; use `useCreateWallet` fallback if needed.
- [ ] Switch wallet to BSC before BSC writes.
- [ ] Read BSC balance and show honest funding state.
- [ ] Wire read-only vault state through a public BSC client.
- [ ] Wire write methods through viem or ethers with the Privy EIP-1193 provider.
- [ ] Keep operator/Guardian methods gated by contract permissions and product copy.
- [ ] Add explicit warnings that Polymarket integration is metadata/off-chain only in the MVP.
