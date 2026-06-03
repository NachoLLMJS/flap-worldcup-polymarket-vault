import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Intent = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
type Size = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent;
  size?: Size;
  dot?: boolean;
}

const intentClasses: Record<Intent, string> = {
  neutral:
    'bg-[--color-bg-higher] text-[--color-fg-muted] border border-[--color-border]',
  accent: 'bg-[--color-accent-soft] text-[--color-accent] border border-[--color-accent]/30',
  success:
    'bg-[--color-success-soft] text-[--color-success] border border-[--color-success]/30',
  warning:
    'bg-[--color-warning-soft] text-[--color-warning] border border-[--color-warning]/30',
  danger:
    'bg-[--color-danger-soft] text-[--color-danger] border border-[--color-danger]/30',
  info: 'bg-[--color-info-soft] text-[--color-info] border border-[--color-info]/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-5 px-2 text-[10px] gap-1',
  md: 'h-6 px-2.5 text-xs gap-1.5',
};

const dotClasses: Record<Intent, string> = {
  neutral: 'bg-[--color-fg-muted]',
  accent: 'bg-[--color-accent]',
  success: 'bg-[--color-success]',
  warning: 'bg-[--color-warning]',
  danger: 'bg-[--color-danger]',
  info: 'bg-[--color-info]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { intent = 'neutral', size = 'sm', dot, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center font-medium uppercase tracking-[0.05em] rounded-[--radius-full]',
        intentClasses[intent],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dotClasses[intent])} />}
      {children}
    </span>
  );
});
