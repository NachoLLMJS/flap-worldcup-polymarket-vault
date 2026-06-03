import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/cn';
import type { Outcome } from '../types';

/** Compact outcome label with flag + localized team name. */
export function OutcomeChip({
  outcome,
  selected,
  onClick,
  as = 'button',
}: {
  outcome: Outcome;
  selected?: boolean;
  onClick?: () => void;
  as?: 'button' | 'span';
}) {
  const { i18n } = useTranslation();
  const name = i18n.resolvedLanguage?.startsWith('zh') ? outcome.zh : outcome.name;

  const content = (
    <>
      <span className="text-base leading-none" aria-hidden>
        {outcome.flag}
      </span>
      <span className="truncate">{name}</span>
    </>
  );

  const classes = cn(
    'inline-flex items-center gap-2 rounded-full border px-3 h-9 text-sm font-medium max-w-full transition-[background,color,border-color] duration-200 ease-out-quint',
    selected
      ? 'bg-accent text-accent-fg border-accent'
      : 'bg-bg text-fg-muted border-border hover:text-fg hover:border-border-strong',
  );

  if (as === 'span') return <span className={classes}>{content}</span>;
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={classes}>
      {content}
    </button>
  );
}
