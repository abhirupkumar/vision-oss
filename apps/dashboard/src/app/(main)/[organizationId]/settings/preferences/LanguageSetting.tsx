'use client';
import { useLocale, useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { languages } from '@/lib/lang';

export function LanguageSetting() {
  const { formatMessage, labels } = useMessages();
  const { locale, saveLocale } = useLocale();

  const handleReset = () => saveLocale(DEFAULT_LOCALE);

  return (
    <div className="flex items-center gap-2 w-full max-w-[420px]">
      <div className="flex-1">
        <Select value={locale} onValueChange={val => saveLocale(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={languages[locale]?.label || formatMessage(labels.language)} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {Object.keys(languages).map(item => (
              <SelectItem key={item} value={item}>
                {languages[item].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={handleReset} type="button">
        {formatMessage(labels.reset)}
      </Button>
    </div>
  );
}
