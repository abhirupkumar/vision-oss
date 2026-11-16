'use client';
import { Maximize2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMessages } from '@/components/hooks';
import { cn } from '@/lib/cn';

export interface PanelProps {
  title?: string;
  allowFullscreen?: boolean;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  minHeight?: string;
  height?: string;
  overflow?: string;
  gap?: string | number;
  padding?: string | number;
}

export function Panel({
  title,
  allowFullscreen,
  style,
  minHeight,
  height,
  overflow,
  gap,
  padding,
  className,
  children,
}: PanelProps) {
  const { formatMessage, labels } = useMessages();
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 rounded-md border border-border bg-card px-4 py-6 md:px-6',
        isFullscreen && 'fixed inset-0 z-9999 overflow-auto rounded-none border-0',
        className,
      )}
      style={{ ...style, minHeight, height, overflow, gap, padding }}
    >
      {(title || allowFullscreen) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
          {allowFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit fullscreen' : formatMessage(labels.maximize)}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {isFullscreen ? <X size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
