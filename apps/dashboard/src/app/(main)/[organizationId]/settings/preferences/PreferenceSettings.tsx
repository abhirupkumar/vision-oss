'use client';
import { useLoginQuery, useMessages } from '@/components/hooks';
import { Label } from '@/components/ui/label';
import { DateRangeSetting } from './DateRangeSetting';
import { LanguageSetting } from './LanguageSetting';
import { ThemeSetting } from './ThemeSetting';
import { TimezoneSetting } from './TimezoneSetting';

export function PreferenceSettings() {
  const { user } = useLoginQuery();
  const { formatMessage, labels } = useMessages();

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[500px]">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold">{formatMessage(labels.defaultDateRange)}</Label>
        <span className="text-xs text-muted-foreground">
          Set the default time range applied to charts and metrics across your workspaces.
        </span>
        <DateRangeSetting />
      </div>

      <div className="border-t border-border pt-6 flex flex-col gap-2">
        <Label className="text-sm font-semibold">{formatMessage(labels.timezone)}</Label>
        <span className="text-xs text-muted-foreground">
          Choose your local timezone for accurate data aggregation and timestamps.
        </span>
        <TimezoneSetting />
      </div>

      <div className="border-t border-border pt-6 flex flex-col gap-2">
        <Label className="text-sm font-semibold">{formatMessage(labels.language)}</Label>
        <span className="text-xs text-muted-foreground">
          Select the interface language for the dashboard.
        </span>
        <LanguageSetting />
      </div>

      <div className="border-t border-border pt-6 flex flex-col gap-2">
        <Label className="text-sm font-semibold">{formatMessage(labels.theme)}</Label>
        <span className="text-xs text-muted-foreground">
          Toggle between light and dark themes.
        </span>
        <ThemeSetting />
      </div>
    </div>
  );
}
