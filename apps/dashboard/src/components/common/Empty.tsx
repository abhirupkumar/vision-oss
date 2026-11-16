import { Database } from 'lucide-react';
import { useMessages } from '@/components/hooks';
import { cn } from '@/lib/cn';

export interface EmptyProps {
  message?: string;
  className?: string;
}

export function Empty({ message, className }: EmptyProps) {
  const { formatMessage, messages } = useMessages();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20',
        className,
      )}
      style={{ minHeight: '240px' }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30 mb-4">
        <Database className="h-6 w-6 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">No records found</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        {message || formatMessage(messages.noDataAvailable)}
      </p>
    </div>
  );
}
