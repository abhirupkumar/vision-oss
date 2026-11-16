import { colord } from 'colord';
import { addHours, format, startOfDay } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useLocale, useMessages, useTheme, useWeeklyTrafficQuery } from '@/components/hooks';
import { getThemeColors } from '@/lib/colors';
import { getDayOfWeekAsDate } from '@/lib/date';

export function WeeklyTraffic({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useWeeklyTrafficQuery(projectId);
  const { dateLocale } = useLocale();
  const { labels, formatMessage } = useMessages();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const { weekStartsOn } = dateLocale.options;
  const { theme } = useTheme();
  const { colors } = useMemo(() => getThemeColors(theme), [theme]);
  const blueColor = colors.theme.primary;

  const daysOfWeek = Array(7)
    .fill(weekStartsOn)
    .map((d, i) => (d + i) % 7);

  const [, max = 1] = data
    ? data.reduce((arr: number[], hours: number[], index: number) => {
        const min = Math.min(...hours);
        const max = Math.max(...hours);

        if (index === 0) {
          return [min, max];
        }

        if (min < arr[0]) {
          arr[0] = min;
        }

        if (max > arr[1]) {
          arr[1] = max;
        }

        return arr;
      }, [])
    : [];

  return (
    <LoadingPanel data={data} isLoading={isLoading} error={error}>
      <div
        className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 overflow-hidden"
        onMouseLeave={() => setTooltip(null)}
      >
        {data && (
          <>
            {/* Top-Left empty corner */}
            <div className="h-6" />

            {/* Day headers row */}
            {daysOfWeek.map((index: number) => (
              <div key={index} className="flex h-6 items-center justify-center">
                <span className="text-center text-xs font-bold text-primary">
                  {format(getDayOfWeekAsDate(index), 'EEE', { locale: dateLocale })}
                </span>
              </div>
            ))}

            {/* Hour rows */}
            {Array(24)
              .fill(null)
              .map((_, hourIndex) => {
                const hourLabel = format(addHours(startOfDay(new Date()), hourIndex), 'haaa', {
                  locale: dateLocale,
                });

                return (
                  <React.Fragment key={hourIndex}>
                    {/* Hour Label Column */}
                    <div className="flex h-[22px] items-center justify-end pr-1">
                      <span className="text-[11px] font-medium text-primary/50">{hourLabel}</span>
                    </div>

                    {/* Day Data Columns for this hour */}
                    {daysOfWeek.map((dayIndex: number) => {
                      const count = data[dayIndex]?.[hourIndex] || 0;
                      const pct = max ? count / max : 0;

                      return (
                        <div
                          key={`${dayIndex}-${hourIndex}`}
                          className="relative flex items-center justify-center h-[22px]"
                          onMouseEnter={e => {
                            if (count > 0) {
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              setTooltip({
                                x: rect.right + 4,
                                y: rect.top,
                                text: `${formatMessage(labels.visitors)}: ${count}`,
                              });
                            }
                          }}
                        >
                          <div
                            className="rounded-[2px]"
                            style={{
                              width: '80%',
                              height: '18px',
                              backgroundColor: colord(blueColor).alpha(0.1).toRgbString(),
                            }}
                          />
                          {count > 0 && (
                            <div
                              className="absolute rounded-[2px]"
                              style={{
                                opacity: 0.4 + pct * 0.6,
                                width: '80%',
                                height: '18px',
                                backgroundColor: blueColor,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
          </>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-xl backdrop-blur-sm transition-opacity"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              backgroundColor: 'white',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </LoadingPanel>
  );
}
