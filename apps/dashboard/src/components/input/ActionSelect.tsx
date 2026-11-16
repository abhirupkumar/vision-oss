import { useMessages } from '@/components/hooks';
import { cn } from '@/lib/cn';

export interface ActionSelectProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function ActionSelect({ value = 'path', onChange }: ActionSelectProps) {
  const { formatMessage, labels } = useMessages();

  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className={cn(
        'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
        'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
      )}
    >
      <option value="path">{formatMessage(labels.viewedPage)}</option>
      <option value="event">{formatMessage(labels.triggeredEvent)}</option>
    </select>
  );
}
