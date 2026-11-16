import Script from 'next/script';
import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Outfit, JetBrains_Mono } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
});

const jbm = JetBrains_Mono({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.className}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
      {(process.env.NEXT_PUBLIC_TRACKER_URL || process.env.trackerId) && (
        <Script
          defer
          data-project-id={process.env.NEXT_PUBLIC_TRACKER_ID || process.env.trackerId}
          src={`${process.env.NEXT_PUBLIC_TRACKER_URL || ''}/script.js`}
        />
      )}
    </html>
  );
}
