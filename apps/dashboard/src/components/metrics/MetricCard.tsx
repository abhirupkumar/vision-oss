'use client';
import { ChangeLabel } from '@/components/metrics/ChangeLabel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/date';
import { formatNumber } from '@/lib/format';

export interface MetricCardProps {
  value: number;
  previousValue?: number;
  change?: number;
  label?: string;
  reverseColors?: boolean;
  formatValue?: (n: any) => string;
  showLabel?: boolean;
  showChange?: boolean;
  tooltip?: React.ReactNode | string;
  chartData?: { x: string; y: number }[];
  chartColor?: 'green' | 'red' | 'blue';
  isPercentage?: boolean;
}

export const MetricCard = ({
  value = 0,
  change = 0,
  label,
  reverseColors = false,
  formatValue = formatNumber,
  showLabel = true,
  showChange = false,
  chartData,
  chartColor,
  isPercentage,
}: MetricCardProps) => {
  const diff = value - change;
  const pct = isPercentage ? change : diff !== 0 ? ((value - diff) / diff) * 100 : 0;

  const positive = change > 0;
  const negative = change < 0;
  const good = reverseColors ? negative : positive;

  let barColorClass = 'bg-muted';
  if (chartColor === 'blue') {
    barColorClass =
      'bg-blue-500/80 dark:bg-blue-400/80 hover:opacity-100 hover:brightness-125 transition-all cursor-pointer';
  } else if (chartColor === 'green' || (chartColor !== 'red' && good)) {
    barColorClass =
      'bg-green-500/60 dark:bg-green-400/30 hover:opacity-100 hover:bg-green-500 dark:hover:bg-green-400/60 transition-all cursor-pointer';
  } else {
    barColorClass =
      'bg-red-500/60 dark:bg-red-400/30 hover:opacity-100 hover:bg-red-500 dark:hover:bg-red-400/60 transition-all cursor-pointer';
  }

  // Calculate max for chart
  const maxVal = chartData ? Math.max(...chartData.map(d => d.y), 1) : 1;

  return (
    <div className="flex flex-col justify-between gap-1 rounded-md border border-border bg-card p-4 min-h-27.5 w-full">
      <div className="flex items-start justify-between w-full">
        {showLabel && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
        {showChange && (
          <ChangeLabel value={change} title={formatValue(change)} reverseColors={reverseColors}>
            <span>{`${Math.abs(~~pct)}%`}</span>
          </ChangeLabel>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <span
          className="truncate text-2xl font-bold tabular-nums text-foreground"
          title={value?.toString()}
        >
          {formatValue(value)}
        </span>

        {chartData && chartData.length > 0 && (
          <TooltipProvider delayDuration={0}>
            <div className="flex items-end gap-1 h-3 w-full">
              {chartData.map((val, i) => {
                const heightPct = Math.max((val.y / maxVal) * 100, 10);
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 ${barColorClass}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-col text-xs text-center">
                        <span className="text-muted-foreground mb-1">
                          {formatDate(val.x, 'PPp')}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatValue(val.y)} {label}
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
