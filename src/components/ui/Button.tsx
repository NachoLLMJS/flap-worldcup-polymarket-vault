import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Intent = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  intent?: Intent;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const intentClasses: Record<Intent, string> = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-pressed shadow-md hover:shadow-glow',
  secondary:
    'bg-bg-elevated text-fg border border-border hover:bg-bg-higher hover:border-border-strong',
  ghost:
    'bg-transparent text-fg-muted hover:bg-bg-elevated hover:text-fg',
  danger:
    'bg-danger text-fg-inverse hover:opacity-90 shadow-md',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    intent = 'primary',
    size = 'md',
    loading,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    ...rest
  },
  forwardedRef,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={forwardedRef}
      {...rest}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-[background,color,box-shadow,border-color] duration-200 ease-out-quint',
        'disabled:opacity-50 disabled:pointer-events-none select-none',
        intentClasses[intent],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      data-loading={loading || undefined}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
