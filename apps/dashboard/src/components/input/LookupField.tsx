'use client';
import { endOfDay, subMonths } from 'date-fns';
import { useMemo, useRef, useState } from 'react';
import { Empty } from '@/components/common/Empty';
import { useDocumentClick, useMessages, useProjectValuesQuery } from '@/components/hooks';
import { useDebounce } from '@/components/hooks/useDebounce';
import { cn } from '@/lib/cn';

export interface LookupFieldProps {
  projectId: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  [key: string]: any;
}

export function LookupField({ projectId, type, value, onChange, ...props }: LookupFieldProps) {
  const { formatMessage, messages } = useMessages();
  const [search, setSearch] = useState(value);
  const [show, setShow] = useState(false);
  const searchValue = useDebounce(search, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const startDate = subMonths(endOfDay(new Date()), 6);
  const endDate = endOfDay(new Date());

  const { data, isLoading } = useProjectValuesQuery({
    projectId,
    type,
    search: searchValue,
    startDate,
    endDate,
  });

  const items: string[] = useMemo(() => {
    return data?.map(({ value }) => value) || [];
  }, [data]);

  useDocumentClick(e => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setShow(false);
    }
  });

  const handleSelect = (item: string) => {
    setSearch(item);
    onChange?.(item);
    setShow(false);
  };

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={containerRef}>
      <input
        type="text"
        aria-label="LookupField"
        className={cn(
          'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
          'text-foreground placeholder:text-muted-foreground',
          'outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
          'w-full transition-all',
        )}
        value={value}
        onFocus={() => setShow(true)}
        autoComplete="off"
        onChange={e => {
          setSearch(e.target.value);
          onChange?.(e.target.value);
          if (!show) setShow(true);
        }}
        {...props}
      />
      {show && (items.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
          {isLoading ? (
            <div className="flex h-12 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4">
              <Empty message={formatMessage(messages.noResultsFound)} />
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-left"
                >
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
