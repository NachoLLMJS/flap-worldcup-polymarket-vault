import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom';
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, placement = 'top', delay = 150, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setOpen(true), delay));
  };
  const hide = () => {
    if (timer) clearTimeout(timer);
    setTimer(null);
    setOpen(false);
  };

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap pointer-events-none',
            'px-2.5 py-1.5 text-xs rounded-sm',
            'bg-bg-higher border border-border text-fg',
            'shadow-lg',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
