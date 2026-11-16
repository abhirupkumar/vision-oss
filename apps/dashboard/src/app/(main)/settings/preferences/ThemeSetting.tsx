'use client';
import { useTheme } from '@/components/hooks';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer',
          theme === 'light'
            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer',
          theme === 'dark'
            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Moon className="h-4 w-4" />
        <span>Dark (Default)</span>
      </button>
    </div>
  );
}
