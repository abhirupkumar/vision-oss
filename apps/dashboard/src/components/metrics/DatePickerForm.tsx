'use client';
import { endOfDay, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { useState } from 'react';
import { useMessages } from '@/components/hooks';
import { cn } from '@/lib/cn';

const FILTER_DAY = 'filter-day';
const FILTER_RANGE = 'filter-range';

export function DatePickerForm({
  startDate: defaultStartDate,
  endDate: defaultEndDate,
  minDate,
  maxDate,
  onChange,
  onClose,
}) {
  const [mode, setMode] = useState<string>(
    isSameDay(defaultStartDate, defaultEndDate) ? FILTER_DAY : FILTER_RANGE,
  );
  const [date, setDate] = useState(defaultStartDate || new Date());
  const [startDate, setStartDate] = useState(defaultStartDate || new Date());
  const [endDate, setEndDate] = useState(defaultEndDate || new Date());
  const { formatMessage, labels } = useMessages();

  const disabled =
    mode === FILTER_DAY
      ? isAfter(minDate, date) && isBefore(maxDate, date)
      : isAfter(startDate, endDate);

  const handleSave = () => {
    if (mode === FILTER_DAY) {
      onChange(`range:${startOfDay(date).getTime()}:${endOfDay(date).getTime()}`);
    } else {
      onChange(`range:${startOfDay(startDate).getTime()}:${endOfDay(endDate).getTime()}`);
    }
  };

  const toInputValue = (d: Date) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fromInputValue = (s: string): Date => {
    if (!s) return new Date();
    return new Date(s + 'T00:00:00');
  };

  const inputClass = cn(
    'rounded-md border border-input bg-background px-3 py-2 text-sm',
    'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 w-full',
  );

  return (
    <div className="flex flex-col gap-4 min-w-[300px]">
      {/* Mode toggle */}
      <div className="flex items-center justify-center">
        <div className="flex rounded-md border border-border p-0.5 bg-muted">
          {[
            { id: FILTER_DAY, label: formatMessage(labels.singleDay) },
            { id: FILTER_RANGE, label: formatMessage(labels.dateRange) },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'rounded px-4 py-1.5 text-sm font-medium transition-all',
                mode === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date inputs */}
      <div className="flex flex-col gap-3">
        {mode === FILTER_DAY ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              className={inputClass}
              value={toInputValue(date)}
              min={toInputValue(minDate)}
              max={toInputValue(maxDate)}
              onChange={e => setDate(fromInputValue(e.target.value))}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-col flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Start date
              </label>
              <input
                type="date"
                className={inputClass}
                value={toInputValue(startDate)}
                min={toInputValue(minDate)}
                max={toInputValue(endDate)}
                onChange={e => setStartDate(fromInputValue(e.target.value))}
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                End date
              </label>
              <input
                type="date"
                className={inputClass}
                value={toInputValue(endDate)}
                min={toInputValue(startDate)}
                max={toInputValue(maxDate)}
                onChange={e => setEndDate(fromInputValue(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          {formatMessage(labels.cancel)}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled}
          className={cn(
            'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {formatMessage(labels.apply)}
        </button>
      </div>
    </div>
  );
}
