'use client';
import { endOfDay, subMonths } from 'date-fns';
import type { Key } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Empty } from '@/components/common/Empty';
import { FilterRecord } from '@/components/common/FilterRecord';
import { useFields, useMessages, useMobile } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface FieldFiltersProps {
  projectId: string;
  value?: { name: string; operator: string; value: string }[];
  exclude?: string[];
  onChange?: (data: any) => void;
}

export function FieldFilters({ projectId, value, exclude = [], onChange }: FieldFiltersProps) {
  const { formatMessage, messages } = useMessages();
  const { fields } = useFields();
  const startDate = subMonths(endOfDay(new Date()), 6);
  const endDate = endOfDay(new Date());
  const { isMobile } = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const updateFilter = (name: string, props: Record<string, any>) => {
    onChange(value.map(filter => (filter.name === name ? { ...filter, ...props } : filter)));
  };

  const handleAdd = (name: string) => {
    setMenuOpen(false);
    onChange(value.concat({ name, operator: 'eq', value: '' }));
  };

  const handleChange = (name: string, val: Key) => {
    updateFilter(name, { value: val });
  };

  const handleSelect = (name: string, operator: Key) => {
    updateFilter(name, { operator });
  };

  const handleRemove = (name: string) => {
    onChange(value.filter(filter => filter.name !== name));
  };

  const availableFields = fields.filter(({ name }) => !exclude.includes(name));

  return (
    <div
      className="grid overflow-hidden gap-y-6"
      style={{ gridTemplateColumns: isMobile ? '1fr' : '180px 1fr' }}
    >
      {/* Mobile: dropdown button */}
      {isMobile && (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            <span className="h-4 w-4">
              <Plus />
            </span>
            Add filter
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {availableFields.map(field => {
                const isDisabled = !!value.find(({ name }) => name === field.name);
                return (
                  <button
                    key={field.name}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleAdd(field.name)}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-sm text-left hover:bg-accent',
                      isDisabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {field.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Desktop: sidebar field list */}
      {!isMobile && (
        <div className="flex flex-col gap-0.5 border-r border-border pr-3 mr-6">
          {availableFields.map(field => {
            const isDisabled = !!value.find(({ name }) => name === field.name);
            return (
              <button
                key={field.name}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && handleAdd(field.name)}
                className={cn(
                  'flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter values */}
      <div className="flex flex-col gap-4 overflow-auto" style={{ contain: 'layout' }}>
        {value.map(filter => (
          <FilterRecord
            key={filter.name}
            projectId={projectId}
            type={filter.name}
            startDate={startDate}
            endDate={endDate}
            {...filter}
            onSelect={handleSelect}
            onRemove={handleRemove}
            onChange={handleChange}
          />
        ))}
        {!value.length && <Empty message={formatMessage(messages.nothingSelected)} />}
      </div>
    </div>
  );
}
