'use client';
import { X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Menu } from '@/components/icons';
import { cn } from '@/lib/cn';

export function MobileMenuButton({
  children,
  ...props
}: {
  children?: ReactNode | (({ close }: { close: () => void }) => ReactNode);
  [key: string]: any;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent"
      >
        <span className="h-4 w-4">
          <Menu />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card overflow-auto">
            <div className="flex items-center justify-end p-4 border-b border-border">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              >
                <X size={14} />
              </button>
            </div>
            <div {...props}>
              {typeof children === 'function'
                ? children({ close: () => setOpen(false) })
                : children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
