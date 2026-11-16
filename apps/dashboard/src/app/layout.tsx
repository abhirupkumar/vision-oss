import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TopProgressBar } from '@/components/common/TopProgressBar';
import { Providers } from './Providers';
import '@/styles/global.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  if (process.env.DISABLE_UI) {
    return (
      <ClerkProvider>
        <html className={cn('font-sans', geist.variable)}>
          <body></body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          /> */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="robots" content="noindex,nofollow" />
        </head>
        <body className={cn('font-sans', geist.variable)}>
          <Suspense>
            <Providers>
              <TopProgressBar />
              {children}
            </Providers>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s | Vision',
    default: 'Vision',
  },
};
