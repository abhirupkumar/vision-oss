'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useLocale } from '@/components/hooks';
import { Toaster } from 'sonner';
import 'chartjs-adapter-date-fns';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

function MessagesProvider({ children }) {
  const { locale, messages, dir } = useLocale();

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale);
  }, [locale, dir]);

  return (
    <IntlProvider locale={locale} messages={messages[locale]} onError={() => null}>
      {children}
    </IntlProvider>
  );
}

export function Providers({ children }) {
  return (
    <MessagesProvider>
      <QueryClientProvider client={client}>
        <ErrorBoundary>
          {children}
          <Toaster position="bottom-right" richColors />
        </ErrorBoundary>
      </QueryClientProvider>
    </MessagesProvider>
  );
}
