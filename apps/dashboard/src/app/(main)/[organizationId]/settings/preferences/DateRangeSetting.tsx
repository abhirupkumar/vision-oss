'use client';
import { useState } from 'react';
import { useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { DateFilter } from '@/components/input/DateFilter';
import { DATE_RANGE_CONFIG, DEFAULT_DATE_RANGE_VALUE } from '@/lib/constants';
import { getItem, setItem } from '@/lib/storage';

export function DateRangeSetting() {
  const { formatMessage, labels } = useMessages();
  const [date, setDate] = useState(getItem(DATE_RANGE_CONFIG) || DEFAULT_DATE_RANGE_VALUE);

  const handleChange = (value: string) => {
    setItem(DATE_RANGE_CONFIG, value);
    setDate(value);
  };

  const handleReset = () => {
    setItem(DATE_RANGE_CONFIG, DEFAULT_DATE_RANGE_VALUE);
    setDate(DEFAULT_DATE_RANGE_VALUE);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-[420px]">
      <div className="flex-1">
        <DateFilter value={date} onChange={handleChange} placement="bottom start" />
      </div>
      <Button variant="outline" size="sm" onClick={handleReset} type="button">
        {formatMessage(labels.reset)}
      </Button>
    </div>
  );
}
