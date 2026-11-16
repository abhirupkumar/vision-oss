import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from '@/components/icons';
import { cn } from '@/lib/cn';

export function ChangeLabel({
  value,
  size,
  reverseColors,
  children,
  ...props
}: {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  title?: string;
  reverseColors?: boolean;
  showPercentage?: boolean;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const positive = value > 0;
  const negative = value < 0;
  const neutral = value === 0 || Number.isNaN(value);
  const good = reverseColors ? negative : positive;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors',
        !neutral && good && 'bg-green-500/10 text-green-600 dark:text-green-400',
        !neutral && !good && 'bg-red-500/10 text-red-600 dark:text-red-400',
        neutral && 'bg-muted text-muted-foreground',
        (props as any).className,
      )}
      style={(props as any).style}
    >
      {(!neutral || value !== 0) && (
        <span className="flex shrink-0 items-center justify-center">
          {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        </span>
      )}
      <span className="flex items-center justify-center">{children || value}</span>
    </div>
  );
}
