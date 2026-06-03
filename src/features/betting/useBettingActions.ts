import { useCallback, useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther, type EIP1193Provider, type WalletClient } from 'viem';
import { bsc } from 'viem/chains';
import { useTranslation } from 'react-i18next';
import { BSC_CHAIN_ID, BETTING_VAULT_ADDRESS } from '../../lib/env';
import { publicClient } from '../../lib/viem';
import { pickBscWallet, type BscWalletLike } from '../wallet/walletHelpers';
import { bettingAbi } from './abi';

export type TxState = 'idle' | 'awaiting-signature' | 'mining' | 'success' | 'error';

export interface TxStatus {
  state: TxState;
  hash: `0x${string}` | null;
  error: string | null;
}

const IDLE: TxStatus = { state: 'idle', hash: null, error: null };

/** Maps common revert/RPC errors to short, translatable copy. */
function readableError(t: (k: string) => string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/insufficient funds|exceeds balance/i.test(msg)) return t('tx.insufficient');
  if (/User rejected|denied|rejected the request/i.test(msg)) return t('tx.rejected');
  if (/closed|not open/i.test(msg)) return t('betting.status.closed');
  return msg.split('\n')[0].slice(0, 140);
}

/** Privy-dependent. Provides the full bet lifecycle against the betting vault.
 *  MUST be used inside the PrivyProvider tree. */
export function useBettingActions() {
  const { t } = useTranslation();
  const { authenticated, login } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const [status, setStatus] = useState<TxStatus>(IDLE);

  const ready = authenticated && Boolean(bscWallet) && Boolean(BETTING_VAULT_ADDRESS) && walletsReady;

  const getClient = useCallback(async (): Promise<{ client: WalletClient; account: `0x${string}` }> => {
    if (!bscWallet) throw new Error('No BSC wallet');
    await bscWallet.switchChain?.(BSC_CHAIN_ID);
    const provider = (await bscWallet.getEthereumProvider?.()) as EIP1193Provider | undefined;
    if (!provider) throw new Error('Wallet provider not ready');
    const client = createWalletClient({ chain: bsc, transport: custom(provider) });
    const [account] = await client.getAddresses();
    return { client, account };
  }, [bscWallet]);

  const run = useCallback(
    async (
      fn: 'placeBet' | 'withdrawBet' | 'claim' | 'refund',
      args: readonly unknown[],
      valueBnb?: string,
    ) => {
      if (!authenticated) return login();
      if (!BETTING_VAULT_ADDRESS) return;
      setStatus({ state: 'awaiting-signature', hash: null, error: null });
      try {
        const { client, account } = await getClient();
        // Generic dispatch across 4 functions (payable + nonpayable) — cast the
        // request to viem's param type at this dynamic boundary.
        const request = {
          chain: bsc,
          account,
          address: BETTING_VAULT_ADDRESS,
          abi: bettingAbi,
          functionName: fn,
          args,
          ...(valueBnb ? { value: parseEther(valueBnb) } : {}),
        } as Parameters<typeof client.writeContract>[0];
        const hash = await client.writeContract(request);
        setStatus({ state: 'mining', hash, error: null });
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus({ state: 'success', hash, error: null });
        return hash;
      } catch (err) {
        setStatus({ state: 'error', hash: null, error: readableError(t, err) });
      }
    },
    [authenticated, login, getClient, t],
  );

  const reset = useCallback(() => setStatus(IDLE), []);

  return {
    ready,
    authenticated,
    login,
    status,
    reset,
    placeBet: (marketId: number, teamId: number, amountBnb: string) =>
      run('placeBet', [BigInt(marketId), BigInt(teamId)], amountBnb),
    withdrawBet: (marketId: number, teamId: number, amountBnb: string) =>
      run('withdrawBet', [BigInt(marketId), BigInt(teamId), parseEther(amountBnb)]),
    claim: (marketId: number) => run('claim', [BigInt(marketId)]),
    refund: (marketId: number) => run('refund', [BigInt(marketId)]),
  };
}
