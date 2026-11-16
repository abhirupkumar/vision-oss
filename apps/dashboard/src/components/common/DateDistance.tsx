import { formatDistanceToNow } from 'date-fns';
import { useLocale, useTimezone } from '@/components/hooks';
import { isInvalidDate } from '@/lib/date';

export function DateDistance({ date }: { date: Date }) {
  const { formatTimezoneDate } = useTimezone();
  const { dateLocale } = useLocale();

  if (isInvalidDate(date)) {
    return null;
  }

  return (
    <span title={formatTimezoneDate(date?.toISOString(), 'PPPpp')}>
      {formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })}
    </span>
  );
}
