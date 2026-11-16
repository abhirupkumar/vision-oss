import { useMessages } from '@/components/hooks';
import { AlertTriangle } from '@/components/icons';

export function ErrorMessage() {
  const { formatMessage, messages } = useMessages();

  return (
    <div className="flex items-center justify-center gap-2 text-destructive">
      <span className="h-4 w-4 shrink-0">
        <AlertTriangle />
      </span>
      <span>{formatMessage(messages.error)}</span>
    </div>
  );
}
