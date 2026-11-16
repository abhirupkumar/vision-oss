'use client';
import { isAfter } from 'date-fns';
import { useMemo } from 'react';
import { useDateRange, useDateRangeQuery, useMessages, useNavigation } from '@/components/hooks';
import { ChevronLeft, ChevronRight } from '@/components/icons';
import { cn } from '@/lib/cn';
import { getDateRangeValue } from '@/lib/date';
import { DateFilter } from './DateFilter';

export interface ProjectDateFilterProps {
  projectId: string;
  compare?: string;
  showAllTime?: boolean;
  showButtons?: boolean;
  allowCompare?: boolean;
}

export function ProjectDateFilter({
  projectId,
  showAllTime = true,
  showButtons = true,
  allowCompare,
}: ProjectDateFilterProps) {
  const { dateRange, isAllTime, isCustomRange } = useDateRange();
  const { formatMessage, labels } = useMessages();
  const {
    router,
    updateParams,
    query: { compare = 'prev', offset = 0 },
  } = useNavigation();
  const disableForward = isAllTime || isAfter(dateRange.endDate, new Date());
  const showCompare = allowCompare && !isAllTime;

  const projectDateRange = useDateRangeQuery(projectId);

  const handleChange = (date: string) => {
    if (date === 'all') {
      router.push(
        updateParams({
          date: `${getDateRangeValue(projectDateRange.startDate, projectDateRange.endDate)}:all`,
          offset: undefined,
        }),
      );
    } else {
      router.push(updateParams({ date, offset: undefined }));
    }
  };

  const handleIncrement = increment => {
    router.push(updateParams({ offset: Number(offset) + increment }));
  };
  const handleSelect = (compare: any) => {
    router.push(updateParams({ compare }));
  };

  const dateValue = useMemo(() => {
    return offset !== 0
      ? getDateRangeValue(dateRange.startDate, dateRange.endDate)
      : dateRange.value;
  }, [dateRange]);

  const btnClass = cn(
    'flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background',
    'text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95',
    'disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100',
  );

  const selectClass = cn(
    'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
    'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showButtons && !isAllTime && !isCustomRange && (
        <div className="flex gap-1">
          <button type="button" onClick={() => handleIncrement(-1)} className={btnClass}>
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(1)}
            disabled={disableForward}
            className={btnClass}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="min-w-[200px]">
        <DateFilter
          value={dateValue}
          onChange={handleChange}
          showAllTime={showAllTime}
          renderDate={+offset !== 0}
        />
      </div>

      {showCompare && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">VS</span>
          <select
            value={compare as string}
            onChange={e => handleSelect(e.target.value)}
            className={selectClass}
            style={{ width: '200px' }}
          >
            <option value="prev">{formatMessage(labels.previousPeriod)}</option>
            <option value="yoy">{formatMessage(labels.previousYear)}</option>
          </select>
        </div>
      )}
    </div>
  );
}
