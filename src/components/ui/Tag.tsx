import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Tag = forwardRef<HTMLButtonElement, TagProps>(function Tag(
  { active, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex items-center h-8 px-3 text-xs font-medium rounded-full transition-[background,color,border-color] duration-200 ease-out-quint',
        active
          ? 'bg-fg text-fg-inverse border border-fg'
          : 'bg-transparent text-fg-muted border border-border hover:text-fg hover:border-border-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
