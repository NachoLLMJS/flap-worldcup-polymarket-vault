import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wordmark } from '../Wordmark';
import { LangSwitch } from '../LangSwitch';
import { WalletMenu } from '../../features/wallet/WalletMenu';
import { cn } from '../../lib/cn';

const links = [
  { to: '/markets', key: 'nav.markets' },
  { to: '/portfolio', key: 'nav.portfolio' },
  { to: '/about', key: 'nav.about' },
] as const;

export function Navbar() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-overlay backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Wordmark />
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-fg bg-bg-elevated'
                      : 'text-fg-muted hover:text-fg',
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitch className="hidden sm:inline-flex" />
          <WalletMenu />
        </div>
      </nav>
    </header>
  );
}
