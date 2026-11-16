import type { ReactNode } from 'react';
import { Empty } from '@/components/common/Empty';
import { cn } from '@/lib/cn';

export function LoadingPanel({
  data,
  error,
  isEmpty,
  isLoading,
  isFetching,
  minHeight,
  renderEmpty = () => <DefaultEmpty />,
  children,
  className,
}: {
  data?: any;
  error?: unknown;
  isEmpty?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  minHeight?: string;
  height?: string;
  gap?: string | number;
  padding?: string | number;
  overflow?: string;
  renderEmpty?: () => ReactNode;
  children: ReactNode;
  className?: string;
}): ReactNode {
  const empty = isEmpty ?? checkEmpty(data);

  if (isLoading || isFetching) {
    return (
      <div
        className={cn('relative flex w-full items-center justify-center', className)}
        style={{ minHeight: minHeight || '200px' }}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Something went wrong.
      </div>
    );
  }

  if (!isLoading && !isFetching && !error && empty) {
    return renderEmpty();
  }

  if (!isLoading && !isFetching && !error && !empty) {
    return <>{children}</>;
  }

  return null;
}

function DefaultEmpty() {
  return <Empty />;
}

function checkEmpty(data: any) {
  if (!data) return false;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    if (Array.isArray(data.data)) {
      return data.data.length === 0;
    }
    return Object.keys(data).length === 0;
  }
  return false;
}
