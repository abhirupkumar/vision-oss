'use client';
import { useState } from 'react';
import { Empty } from '@/components/common/Empty';
import { useFilters, useFormat, useProjectValuesQuery } from '@/components/hooks';
import { X } from '@/components/icons';
import { cn } from '@/lib/cn';
import { isSearchOperator } from '@/lib/params';

export interface FilterRecordProps {
  projectId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  name: string;
  operator: string;
  value: string;
  onSelect?: (name: string, value: any) => void;
  onRemove?: (name: string) => void;
  onChange?: (name: string, value: string) => void;
}

export function FilterRecord({
  projectId,
  type,
  startDate,
  endDate,
  name,
  operator,
  value,
  onSelect,
  onRemove,
  onChange,
}: FilterRecordProps) {
  const { fields, operators } = useFilters();
  const [selected, setSelected] = useState(value);
  const [search, setSearch] = useState('');
  const { formatValue } = useFormat();
  const { data, isLoading } = useProjectValuesQuery({
    projectId,
    type,
    search,
    startDate,
    endDate,
  });
  const isSearch = isSearchOperator(operator);
  const items = data?.filter(({ value }) => value) || [];

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleSelectOperator = (value: any) => {
    onSelect?.(name, value);
  };

  const handleSelectValue = (value: string) => {
    setSelected(value);
    onChange?.(name, value);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {fields.find(f => f.name === name)?.label}
      </label>
      <div className="grid gap-2" style={{ gridTemplateColumns: '1fr auto' }}>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'minmax(0,200px) 1fr' }}>
          {/* Operator select */}
          <select
            className={cn(
              'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
              'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
            )}
            value={operator}
            onChange={e => handleSelectOperator(e.target.value)}
          >
            {operators
              .filter(({ type }) => type === 'string')
              .map(({ name, label }: any) => (
                <option key={name} value={name}>
                  {label}
                </option>
              ))}
          </select>

          {/* Value input/select */}
          {isSearch ? (
            <input
              type="text"
              className={cn(
                'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
                'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
              )}
              value={selected}
              defaultValue={selected}
              onChange={e => handleSelectValue(e.target.value)}
            />
          ) : (
            <select
              className={cn(
                'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
                'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
              )}
              value={selected}
              onChange={e => handleSelectValue(e.target.value)}
            >
              {items.map(({ value }) => (
                <option key={value} value={value}>
                  {formatValue(value, type)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-start">
          <button
            type="button"
            onClick={() => onRemove?.(name)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <span className="h-4 w-4">
              <X />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
