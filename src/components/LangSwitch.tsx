import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';
import { cn } from '../lib/cn';

const labels: Record<SupportedLanguage, string> = {
  en: 'EN',
  zh: '中',
};

export function LangSwitch({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2) as SupportedLanguage;

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-[--radius-full] border border-[--color-border] bg-[--color-bg-elevated]',
        className,
      )}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center justify-center min-w-8 h-7 px-2 text-xs font-medium uppercase tracking-[0.06em]',
              'rounded-[--radius-full] transition-[background,color] duration-[--duration-base] ease-[--ease-out-quint]',
              active
                ? 'bg-[--color-fg] text-[--color-fg-inverse]'
                : 'bg-transparent text-[--color-fg-muted] hover:text-[--color-fg]',
            )}
          >
            {labels[lng]}
          </button>
        );
      })}
    </div>
  );
}
