import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { BSC_RPC_URL } from './env';

/** Shared read-only client for BSC. Works without a wallet. */
export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(BSC_RPC_URL),
  batch: { multicall: true },
});
