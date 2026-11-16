'use client';
import type { ReactNode } from 'react';
import { useMessages } from '@/components/hooks';
import { cn } from '@/lib/cn';

export function PageBody({
  maxWidth = '1320px',
  error,
  isLoading,
  gap,
  className,
  children,
}: {
  maxWidth?: string;
  error?: unknown;
  isLoading?: boolean;
  gap?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const { formatMessage, messages } = useMessages();

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formatMessage(messages.error)}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col px-4 pb-6 pt-0 md:px-6',
        gap && 'gap-6',
        className,
      )}
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
}
