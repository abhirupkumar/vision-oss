'use client';
import { useEffect, useRef, useState } from 'react';
import { DateRangeSetting } from '@/app/(main)/[organizationId]/settings/preferences/DateRangeSetting';
import { TimezoneSetting } from '@/app/(main)/[organizationId]/settings/preferences/TimezoneSetting';
import { useMessages } from '@/components/hooks';
import { Settings } from '@/components/icons';

export function PreferencesButton() {
  const { formatMessage, labels } = useMessages();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className="h-5 w-5">
          <Settings />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[240px] rounded-md border border-border bg-popover shadow-lg p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {formatMessage(labels.timezone)}
            </label>
            <TimezoneSetting />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {formatMessage(labels.defaultDateRange)}
            </label>
            <DateRangeSetting />
          </div>
        </div>
      )}
    </div>
  );
}
