import { shortAddress } from '../../lib/format';

export type BscWalletLike = {
  address?: string;
  type?: string;
  chainType?: string;
  walletClientType?: string;
  switchChain?: (chainId: number) => Promise<void>;
  getEthereumProvider?: () => Promise<unknown>;
};

export type TwitterProfileLike = {
  username?: string | null;
  name?: string | null;
  profilePictureUrl?: string | null;
};

export type UserWalletLike = {
  wallet?: { address?: string; chainType?: string; walletClientType?: string };
  twitter?: TwitterProfileLike;
  email?: { address?: string };
  google?: { email?: string };
  linkedAccounts?: Array<{
    type?: string;
    address?: string;
    chainType?: string;
    walletClientType?: string;
    username?: string | null;
    name?: string | null;
    profilePictureUrl?: string | null;
  }>;
};

export function isBscCapableWallet(wallet: BscWalletLike): boolean {
  // Privy names all EVM-compatible wallets "ethereum" at the SDK/API layer.
  // BSC is still the selected runtime chain through defaultChain/supportedChains + switchChain(56).
  return (
    Boolean(wallet.address) &&
    (wallet.type === 'ethereum' ||
      wallet.chainType === 'ethereum' ||
      typeof wallet.getEthereumProvider === 'function' ||
      typeof wallet.switchChain === 'function')
  );
}

export function isPrivyEmbeddedWallet(wallet: BscWalletLike): boolean {
  return (
    wallet.walletClientType === 'privy' ||
    wallet.walletClientType === 'privy-v2' ||
    Boolean((wallet as { imported?: boolean }).imported)
  );
}

export function pickBscWallet(wallets: BscWalletLike[]): BscWalletLike | null {
  return (
    wallets.find((wallet) => isBscCapableWallet(wallet) && isPrivyEmbeddedWallet(wallet)) ??
    wallets.find(isBscCapableWallet) ??
    null
  );
}

export function pickUserBscAddress(user?: UserWalletLike | null): string | null {
  const primary = user?.wallet;
  if (primary?.address && primary.chainType !== 'solana') return primary.address;
  const linked = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && account.address && account.chainType !== 'solana',
  );
  return linked?.address ?? null;
}

export function walletDisplay(
  wallet: BscWalletLike | null,
  userWalletAddress?: string | null,
): string {
  if (wallet?.address) return shortAddress(wallet.address);
  if (userWalletAddress) return `${shortAddress(userWalletAddress)} · reconnect`;
  return 'No BSC wallet yet';
}

export function pickTwitterProfile(user?: UserWalletLike | null): TwitterProfileLike | null {
  if (user?.twitter?.username || user?.twitter?.name || user?.twitter?.profilePictureUrl) {
    return user.twitter;
  }
  const linkedTwitter = user?.linkedAccounts?.find(
    (account) => account.type === 'twitter_oauth' || account.type === 'twitter',
  );
  if (
    linkedTwitter?.username ||
    linkedTwitter?.name ||
    linkedTwitter?.profilePictureUrl
  ) {
    return linkedTwitter;
  }
  return null;
}

export function fallbackIdentity(user?: UserWalletLike | null): string {
  return user?.email?.address ?? user?.google?.email ?? 'Privy connected';
}
