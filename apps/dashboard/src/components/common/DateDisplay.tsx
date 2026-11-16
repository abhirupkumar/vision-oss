import { differenceInDays, isSameDay } from 'date-fns';
import { useLocale } from '@/components/hooks';
import { Calendar } from '@/components/icons';
import { formatDate } from '@/lib/date';

export function DateDisplay({ startDate, endDate }) {
  const { locale } = useLocale();
  const isSingleDate = differenceInDays(endDate, startDate) === 0;

  return (
    <div className="flex flex-nowrap items-center gap-2 text-sm">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
        <Calendar />
      </span>
      <span className="whitespace-nowrap">
        {isSingleDate ? (
          formatDate(startDate, 'PP', locale)
        ) : (
          <>
            {formatDate(startDate, 'PP', locale)}
            {!isSameDay(startDate, endDate) && ` — ${formatDate(endDate, 'PP', locale)}`}
          </>
        )}
      </span>
    </div>
  );
}
