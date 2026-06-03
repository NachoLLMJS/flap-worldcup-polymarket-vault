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
    'bg-bg-higher text-fg-muted border border-border',
  accent: 'bg-accent-soft text-accent border border-accent/30',
  success:
    'bg-success-soft text-success border border-success/30',
  warning:
    'bg-warning-soft text-warning border border-warning/30',
  danger:
    'bg-danger-soft text-danger border border-danger/30',
  info: 'bg-info-soft text-info border border-info/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-5 px-2 text-[10px] gap-1',
  md: 'h-6 px-2.5 text-xs gap-1.5',
};

const dotClasses: Record<Intent, string> = {
  neutral: 'bg-fg-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { intent = 'neutral', size = 'sm', dot, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center font-medium uppercase tracking-[0.05em] rounded-full',
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
