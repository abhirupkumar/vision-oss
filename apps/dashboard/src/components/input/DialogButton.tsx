'use client';
import { X } from 'lucide-react';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { useMobile } from '@/components/hooks';
import { cn } from '@/lib/cn';

export interface DialogButtonProps {
  icon?: ReactNode;
  label?: ReactNode;
  title?: ReactNode;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  children?: ReactNode | (({ close }: { close: () => void }) => ReactNode);
  variant?: string;
  [key: string]: any;
}

export function DialogButton({
  icon,
  label,
  title,
  width,
  height,
  minWidth,
  minHeight,
  children,
  variant,
  ...props
}: DialogButtonProps) {
  const [open, setOpen] = useState(false);
  const { isMobile } = useMobile();

  const dialogStyle: CSSProperties = {
    width: isMobile ? '100%' : width,
    height: isMobile ? '100%' : height,
    minWidth: isMobile ? undefined : minWidth,
    minHeight: isMobile ? undefined : minHeight,
    maxHeight: isMobile ? '100%' : 'calc(100dvh - 40px)',
    padding: '32px',
    overflowY: isMobile ? 'auto' : undefined,
  };

  const isPrimary = variant === 'primary';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-accent active:scale-95',
          isPrimary ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-foreground',
        )}
        {...props}
      >
        {icon && <div className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</div>}
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'relative z-10 rounded-lg border border-border bg-card shadow-xl',
              isMobile && 'inset-0 rounded-none',
            )}
            style={dialogStyle}
          >
            <div className="mb-4 flex items-center justify-between">
              {(title || label) && (
                <h2 className="text-lg font-semibold text-foreground">{title || label}</h2>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              >
                <X size={14} />
              </button>
            </div>
            {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
          </div>
        </div>
      )}
    </>
  );
}
