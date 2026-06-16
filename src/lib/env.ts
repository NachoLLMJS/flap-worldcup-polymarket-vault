import { bsc } from 'viem/chains';

/** Public, build-time environment values. Safe to expose to the browser. */
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID as string | undefined;
export const FLAP_TOKEN_ADDRESS = import.meta.env.VITE_FLAP_TOKEN_ADDRESS as `0x${string}` | undefined;
export const VAULT_ADDRESS = import.meta.env.VITE_FLAP_VAULT_ADDRESS as `0x${string}` | undefined;
export const FLAP_VAULT_FACTORY_ADDRESS = import.meta.env.VITE_FLAP_VAULT_FACTORY_ADDRESS as
  | `0x${string}`
  | undefined;
export const FLAP_VAULT_IMPLEMENTATION_ADDRESS = import.meta.env.VITE_FLAP_VAULT_IMPLEMENTATION_ADDRESS as
  | `0x${string}`
  | undefined;
export const FLAP_VAULT_BEACON_ADDRESS = import.meta.env.VITE_FLAP_VAULT_BEACON_ADDRESS as
  | `0x${string}`
  | undefined;
export const BETTING_VAULT_ADDRESS = import.meta.env.VITE_BETTING_VAULT_ADDRESS as
  | `0x${string}`
  | undefined;
export const WORLD_CUP_VIEWER_ADDRESS = import.meta.env.VITE_WORLD_CUP_VIEWER_ADDRESS as
  | `0x${string}`
  | undefined;
export const BSC_RPC_URL = import.meta.env.VITE_BSC_RPC_URL as string | undefined;

export const BSC_CHAIN_ID = bsc.id;

/** Protocol fee recipient, hardcoded in the betting vault. */
export const FEE_WALLET = '0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e' as const;

/** Protocol fee in basis points (1%). Matches PROTOCOL_FEE_BPS on-chain. */
export const PROTOCOL_FEE_BPS = 100;

/** True when Privy is configured and the app can drive real login. */
export const isPrivyConfigured = Boolean(PRIVY_APP_ID);
