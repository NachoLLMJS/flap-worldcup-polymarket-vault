import { bsc } from 'viem/chains';

/** Public, build-time environment values. Safe to expose to the browser. */
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID as string | undefined;
export const FLAP_TOKEN_ADDRESS = (import.meta.env.VITE_FLAP_TOKEN_ADDRESS ||
  '0x45f9Aa71935DbCBF0D122283B52d6C421C6f7777') as `0x${string}`;
export const VAULT_ADDRESS = (import.meta.env.VITE_FLAP_VAULT_ADDRESS ||
  '0x770171B5E6CDe9eFD9D0bAa7aed393395A2872e8') as `0x${string}`;
export const FLAP_VAULT_FACTORY_ADDRESS = (import.meta.env.VITE_FLAP_VAULT_FACTORY_ADDRESS ||
  '0x173F25D505A73c2A0C3922BbD29f5feB28fd829b') as `0x${string}`;
export const FLAP_VAULT_IMPLEMENTATION_ADDRESS = (import.meta.env.VITE_FLAP_VAULT_IMPLEMENTATION_ADDRESS ||
  '0x71FF865C9477DFd3D40e3AC21fcbcc8c24B64CC6') as `0x${string}`;
export const FLAP_VAULT_BEACON_ADDRESS = (import.meta.env.VITE_FLAP_VAULT_BEACON_ADDRESS ||
  '0x7eb082a4f8461f1Ede14D63155a5da9Da3145Ae1') as `0x${string}`;
export const BETTING_VAULT_ADDRESS = (import.meta.env.VITE_BETTING_VAULT_ADDRESS ||
  '0x6013Cdc9A6300CE133B418283bBfe206B0aE858d') as `0x${string}`;
export const WORLD_CUP_VIEWER_ADDRESS = (import.meta.env.VITE_WORLD_CUP_VIEWER_ADDRESS ||
  '0x00036192958C2aaAF9F445d3Cdc2979995EA333e') as `0x${string}`;
export const BSC_RPC_URL = import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
export const BETTING_VAULT_DEPLOY_BLOCK = BigInt(
  import.meta.env.VITE_BETTING_VAULT_DEPLOY_BLOCK || '105723741',
);

export const BSC_CHAIN_ID = bsc.id;

/** Protocol fee recipient, hardcoded in the betting vault. */
export const FEE_WALLET = '0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e' as const;

/** Protocol fee in basis points (1%). Matches PROTOCOL_FEE_BPS on-chain. */
export const PROTOCOL_FEE_BPS = 100;

/** True when Privy is configured and the app can drive real login. */
export const isPrivyConfigured = Boolean(PRIVY_APP_ID);
