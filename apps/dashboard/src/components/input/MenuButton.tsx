'use client';
import type { Key, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Ellipsis } from '@/components/icons';
import { cn } from '@/lib/cn';

export function MenuButton({
  children,
  onAction,
  isDisabled,
}: {
  children: ReactNode;
  onAction?: (action: string) => void;
  isDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAction = (key: Key) => {
    setOpen(false);
    onAction?.(key.toString());
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <span className="h-4 w-4">
          <Ellipsis />
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-popover shadow-lg">
          <div
            role="menu"
            aria-label="menu"
            onClick={e => {
              const target = (e.target as HTMLElement).closest('[data-key]');
              if (target) handleAction(target.getAttribute('data-key'));
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
