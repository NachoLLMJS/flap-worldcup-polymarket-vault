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
        'inline-flex items-center h-8 px-3 text-xs font-medium rounded-[--radius-full] transition-[background,color,border-color] duration-[--duration-base] ease-[--ease-out-quint]',
        active
          ? 'bg-[--color-fg] text-[--color-fg-inverse] border border-[--color-fg]'
          : 'bg-transparent text-[--color-fg-muted] border border-[--color-border] hover:text-[--color-fg] hover:border-[--color-border-strong]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
