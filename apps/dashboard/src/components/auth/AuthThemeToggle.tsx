'use client';

import { useTheme } from '@/components/hooks';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AuthThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-20 rounded-full bg-slate-200/50 dark:bg-zinc-800/50 animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-indigo-500" />
          <span>Dark mode</span>
        </>
      )}
    </button>
  );
}
