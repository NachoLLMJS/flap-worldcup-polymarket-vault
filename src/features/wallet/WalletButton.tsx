import { usePrivy, useWallets } from '@privy-io/react-auth';
import { walletDisplay, pickBscWallet, pickUserBscAddress, type BscWalletLike, type UserWalletLike } from './walletHelpers';
import { TwitterProfilePill } from './TwitterProfilePill';

export function ConnectWalletButton({ configReady }: { configReady: boolean }) {
  if (!configReady)
    return (
      <button className="btn primary connectButton" type="button" disabled>
        Privy needed
      </button>
    );
  return <ConnectedPrivyButton />;
}

function ConnectedPrivyButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const bscWallet = pickBscWallet(wallets as BscWalletLike[]);
  const userWalletAddress = pickUserBscAddress(user as UserWalletLike | null);
  if (!ready)
    return (
      <button className="btn primary connectButton" type="button" disabled>
        Privy init…
      </button>
    );
  if (!authenticated)
    return (
      <button className="btn primary connectButton" type="button" onClick={login}>
        Connect
      </button>
    );
  return (
    <div className="connectedCluster">
      <TwitterProfilePill user={user as UserWalletLike | null} />
      <span className="walletPill">BSC · {walletDisplay(bscWallet, userWalletAddress)}</span>
      <button className="btn ghost connectButton" type="button" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
