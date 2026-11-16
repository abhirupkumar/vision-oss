'use client';
import { endOfYear } from 'date-fns';
import { X } from 'lucide-react';
import { Fragment, type Key, useState } from 'react';
import { DateDisplay } from '@/components/common/DateDisplay';
import { useMessages, useMobile } from '@/components/hooks';
import { DatePickerForm } from '@/components/metrics/DatePickerForm';
import { cn } from '@/lib/cn';
import { parseDateRange } from '@/lib/date';

export interface DateFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  showAllTime?: boolean;
  renderDate?: boolean;
  placement?: any;
  [key: string]: any;
}

export function DateFilter({
  value,
  onChange,
  showAllTime,
  renderDate,
  placement = 'bottom',
  ...props
}: DateFilterProps) {
  const { formatMessage, labels } = useMessages();
  const [showPicker, setShowPicker] = useState(false);
  const { startDate, endDate } = parseDateRange(value) || {};
  const { isMobile } = useMobile();

  const options = [
    { label: formatMessage(labels.today), value: '0day' },
    { label: formatMessage(labels.lastHours, { x: '24' }), value: '24hour' },
    { label: formatMessage(labels.thisWeek), value: '0week', divider: true },
    { label: formatMessage(labels.lastDays, { x: '7' }), value: '7day' },
    { label: formatMessage(labels.thisMonth), value: '0month', divider: true },
    { label: formatMessage(labels.lastDays, { x: '30' }), value: '30day' },
    { label: formatMessage(labels.lastDays, { x: '90' }), value: '90day' },
    { label: formatMessage(labels.thisYear), value: '0year' },
    { label: formatMessage(labels.lastMonths, { x: '6' }), value: '6month', divider: true },
    { label: formatMessage(labels.lastMonths, { x: '12' }), value: '12month' },
    showAllTime && { label: formatMessage(labels.allTime), value: 'all', divider: true },
    { label: formatMessage(labels.customRange), value: 'custom', divider: true },
  ].filter(Boolean);

  const selectedValue = value?.endsWith(':all') ? 'all' : value;

  const getDisplayLabel = () => {
    if (value?.startsWith('range') || renderDate) {
      return <DateDisplay startDate={startDate} endDate={endDate} />;
    }
    const opt = options.find(o => (o as any).value === selectedValue);
    return (opt as any)?.label || formatMessage(labels.selectDate);
  };

  const handleChange = (val: string) => {
    if (val === 'custom') {
      setShowPicker(true);
      return;
    }
    onChange?.(val);
  };

  const handlePickerChange = (val: string) => {
    setShowPicker(false);
    onChange?.(val);
  };

  return (
    <>
      <select
        value={selectedValue}
        onChange={e => handleChange(e.target.value)}
        className={cn(
          'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
          'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
          'w-full',
        )}
        {...props}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom date picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          />
          <div className="relative z-10 rounded-lg border border-border bg-card p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <X size={14} />
            </button>
            <DatePickerForm
              startDate={startDate}
              endDate={endDate}
              minDate={new Date(2000, 0, 1)}
              maxDate={endOfYear(new Date())}
              onChange={handlePickerChange}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
