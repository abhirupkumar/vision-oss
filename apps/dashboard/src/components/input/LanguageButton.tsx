'use client';
import { Globe } from 'lucide-react';
import { useLocale } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { languages } from '@/lib/lang';

export function LanguageButton() {
  const { locale, saveLocale } = useLocale();
  const items = Object.keys(languages).map(key => ({ ...languages[key], value: key }));

  function handleSelect(value: string) {
    saveLocale(value);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[640px] p-2">
        <div className="grid grid-cols-3 gap-1 overflow-auto max-h-[400px]">
          {items.map(({ value, label }) => {
            const isActive = value === locale;
            return (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                className={cn(
                  'justify-start text-xs font-medium',
                  isActive ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground',
                )}
                onClick={() => handleSelect(value)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
