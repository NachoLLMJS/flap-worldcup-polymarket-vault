import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Size = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: Size;
  invalid?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', invalid, leftSlot, rightSlot, className, ...rest },
  ref,
) {
  const hasSlot = Boolean(leftSlot || rightSlot);

  if (!hasSlot) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full bg-bg border border-border rounded-md px-3 font-mono tabular-nums',
          'placeholder:text-fg-subtle text-fg',
          'transition-[border-color,box-shadow] duration-150 ease-out-quint',
          'hover:border-border-strong',
          'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          invalid && 'border-danger focus:border-danger focus:ring-danger-soft',
          sizeClasses[inputSize],
          className,
        )}
        {...rest}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full bg-bg border border-border rounded-md px-3 has-[input:focus]:border-accent has-[input:focus]:ring-2 has-[input:focus]:ring-accent-soft transition-[border-color,box-shadow] duration-150',
        invalid && 'border-danger has-[input:focus]:border-danger',
        sizeClasses[inputSize],
      )}
    >
      {leftSlot && <div className="flex items-center text-fg-muted">{leftSlot}</div>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex-1 bg-transparent border-0 outline-none font-mono tabular-nums text-fg',
          'placeholder:text-fg-subtle',
          className,
        )}
        {...rest}
      />
      {rightSlot && <div className="flex items-center text-fg-muted">{rightSlot}</div>}
    </div>
  );
});
