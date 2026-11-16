import { useLocale } from '@/components/hooks';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';

export function MonthSelect({ date = new Date(), onChange }) {
  const { locale } = useLocale();
  const month = date.getMonth();
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  const months = [...Array(12)].map((_, i) => i);
  const years = [...Array(10)].map((_, i) => currentYear - i);

  const handleMonthChange = (m: number) => {
    const d = new Date(date);
    d.setMonth(m);
    onChange?.(d);
  };
  const handleYearChange = (y: number) => {
    const d = new Date(date);
    d.setFullYear(y);
    onChange?.(d);
  };

  const selectClass = cn(
    'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
    'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
  );

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={e => handleMonthChange(Number(e.target.value))}
        className={selectClass}
      >
        {months.map(m => (
          <option key={m} value={m}>
            {formatDate(new Date(year, m, 1), 'MMMM', locale)}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => handleYearChange(Number(e.target.value))}
        className={selectClass}
      >
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
