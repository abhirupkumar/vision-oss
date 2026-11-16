'use client';
import { useMessages, useTimezone } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTimezone } from '@/lib/date';

const timezones = Intl.supportedValuesOf('timeZone');

export function TimezoneSetting() {
  const { formatMessage, labels } = useMessages();
  const { timezone, saveTimezone } = useTimezone();

  const handleReset = () => saveTimezone(getTimezone());

  return (
    <div className="flex items-center gap-2 w-full max-w-[420px]">
      <div className="flex-1">
        <Select value={timezone} onValueChange={value => saveTimezone(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={timezone || formatMessage(labels.timezone)} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {timezones.map(item => (
              <SelectItem key={item} value={item}>
                {item}
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
