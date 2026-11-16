'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export function TopProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When pathname changes, it means navigation completed.
    // We stop the progress bar.
    setIsNavigating(false);
    setProgress(0);
  }, [pathname]);

  // We can't easily detect "start" of navigation in Next.js App Router
  // without wrapping all Links.
  // But we can at least show a quick progress bar when the pathname is about to change.
  // Actually, a better way is to show it when any link is clicked.

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        if (anchor.href !== window.location.href) {
          setIsNavigating(true);
          setProgress(30);

          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(interval);
                return 90;
              }
              return prev + 5;
            });
          }, 200);

          return () => clearInterval(interval);
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ width: 0, opacity: 1 }}
          animate={{ width: `${progress}%` }}
          exit={{ width: '100%', opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed left-0 top-0 z-[9999] h-1 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          style={{
            backgroundColor: 'var(--primary)',
            // Using a color from the theme if possible, otherwise fallback to a nice blue
            background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
          }}
        />
      )}
    </AnimatePresence>
  );
}
