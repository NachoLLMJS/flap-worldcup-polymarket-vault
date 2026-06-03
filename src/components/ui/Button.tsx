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
    'bg-[--color-accent] text-[--color-accent-fg] hover:bg-[--color-accent-hover] active:bg-[--color-accent-pressed] shadow-[--shadow-md] hover:shadow-[--shadow-glow]',
  secondary:
    'bg-[--color-bg-elevated] text-[--color-fg] border border-[--color-border] hover:bg-[--color-bg-higher] hover:border-[--color-border-strong]',
  ghost:
    'bg-transparent text-[--color-fg-muted] hover:bg-[--color-bg-elevated] hover:text-[--color-fg]',
  danger:
    'bg-[--color-danger] text-[--color-fg-inverse] hover:opacity-90 shadow-[--shadow-md]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[--radius-sm]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[--radius-md]',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-[--radius-lg]',
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
        'inline-flex items-center justify-center font-medium transition-[background,color,box-shadow,border-color] duration-[--duration-base] ease-[--ease-out-quint]',
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
