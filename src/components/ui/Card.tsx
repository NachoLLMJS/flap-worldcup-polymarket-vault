import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'default' | 'elevated' | 'outline' | 'ghost';
type Padding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  interactive?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-bg-elevated border border-border',
  elevated: 'bg-bg-elevated border border-border shadow-lg',
  outline: 'bg-transparent border border-border',
  ghost: 'bg-transparent',
};

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', interactive, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl',
        variantClasses[variant],
        paddingClasses[padding],
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-200 ease-out-quint hover:border-border-strong hover:shadow-xl hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...rest}
    />
  );
});
