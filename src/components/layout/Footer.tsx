import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wordmark } from '../Wordmark';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border-subtle mt-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="max-w-sm text-sm text-fg-subtle">{t('brand.tagline')}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
          <Link to="/markets" className="hover:text-fg">
            {t('nav.markets')}
          </Link>
          <Link to="/portfolio" className="hover:text-fg">
            {t('nav.portfolio')}
          </Link>
          <Link to="/about" className="hover:text-fg">
            {t('nav.about')}
          </Link>
          <a
            href="https://bscscan.com/address/0x2c194de4fc820128044b4b405a5e8e5bd1e91358"
            target="_blank"
            rel="noreferrer"
            className="hover:text-fg"
          >
            BscScan
          </a>
        </div>
      </div>
      <div className="border-t border-border-subtle">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-fg-subtle sm:px-6">
          Built on BNB Chain · Settlement via Flap WorldCupViewer · A 1% platform fee applies per bet.
        </p>
      </div>
    </footer>
  );
}
