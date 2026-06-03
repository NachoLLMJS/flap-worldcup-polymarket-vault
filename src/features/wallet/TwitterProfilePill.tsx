import { fallbackIdentity, pickTwitterProfile, type UserWalletLike } from './walletHelpers';

export function TwitterProfilePill({ user }: { user?: UserWalletLike | null }) {
  const twitter = pickTwitterProfile(user);
  const username = twitter?.username?.replace(/^@/, '');
  const displayName = twitter?.name || (username ? `@${username}` : fallbackIdentity(user));
  const subline = username ? `@${username}` : 'Twitter not linked';
  const href = username ? `https://x.com/${username}` : undefined;
  const avatar = twitter?.profilePictureUrl;
  const content = (
    <>
      {avatar ? (
        <img className="twitterAvatar" src={avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="twitterAvatar fallback">𝕏</span>
      )}
      <span className="twitterCopy">
        <b>{displayName}</b>
        <small>{subline}</small>
      </span>
    </>
  );
  if (href)
    return (
      <a className="twitterPill" href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  return <span className="twitterPill muted">{content}</span>;
}
