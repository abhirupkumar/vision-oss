'use client';
import { AlertCircle } from 'lucide-react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary as Boundary } from 'react-error-boundary';
import { useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';

const logError = (error: Error, info: ErrorInfo) => {
  // eslint-disable-next-line no-console
  console.error(error, info.componentStack);
};

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { formatMessage, labels, messages } = useMessages();

  const fallbackRender = ({ error, resetErrorBoundary }) => {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-4 w-full h-full min-h-[300px] p-6 text-center"
      >
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{formatMessage(messages.error)}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{error.message}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {formatMessage(labels.refresh)}
          </Button>
          <Button onClick={resetErrorBoundary}>{formatMessage(labels.retry) || 'Retry'}</Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-8 p-4 rounded-md bg-muted text-left text-xs overflow-auto max-w-full font-mono">
            {error.stack}
          </pre>
        )}
      </div>
    );
  };

  return (
    <Boundary fallbackRender={fallbackRender} onError={logError}>
      {children}
    </Boundary>
  );
}
