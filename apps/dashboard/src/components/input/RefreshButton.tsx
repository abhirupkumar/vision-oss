import { useDateRange, useMessages } from '@/components/hooks';
import { RefreshCw } from '@/components/icons';
import { cn } from '@/lib/cn';
import { setProjectDateRange } from '@/store/projects';

export function RefreshButton({
  projectId,
  isLoading,
}: {
  projectId: string;
  isLoading?: boolean;
}) {
  const { formatMessage, labels } = useMessages();
  const { dateRange } = useDateRange();

  function handleClick() {
    if (!isLoading && dateRange) {
      setProjectDateRange(projectId, dateRange);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={formatMessage(labels.refresh)}
      disabled={isLoading}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background',
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      <span className={cn('h-4 w-4', isLoading && 'animate-spin')}>
        <RefreshCw />
      </span>
    </button>
  );
}
