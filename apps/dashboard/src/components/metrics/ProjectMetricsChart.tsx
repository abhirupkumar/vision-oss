import { TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { AreaChartInteractive } from '@/components/charts/AreaChartInteractive';
import { useLocale, useMessages, useTheme } from '@/components/hooks';
import type { ChartConfig } from '@/components/ui/chart';
import { renderDateLabels, renderNumberLabels } from '@/lib/charts';
import { getThemeColors } from '@/lib/colors';
import { generateTimeSeries } from '@/lib/date';

export interface ProjectMetricsChartProps {
  data: {
    revenue: any[];
    sessions: any[];
    compare?: {
      revenue: any[];
      sessions: any[];
    };
  };
  unit: string;
  minDate: Date;
  maxDate: Date;
}

export function ProjectMetricsChart({ data, unit, minDate, maxDate }: ProjectMetricsChartProps) {
  const { formatMessage, labels } = useMessages();
  const { locale, dateLocale } = useLocale();
  const { theme } = useTheme();
  const { colors } = useMemo(() => getThemeColors(theme), [theme]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      visitors: {
        label: formatMessage(labels.visitors),
        color: colors.chart.visitors.borderColor,
      },
      revenue: {
        label: formatMessage(labels.revenue),
        color: '#22c55e',
      },
    };

    if (data?.compare) {
      config.compareVisitors = {
        label: `${formatMessage(labels.visitors)} (${formatMessage(labels.previous)})`,
        color: 'var(--chart-3)',
      };
      config.compareRevenue = {
        label: `${formatMessage(labels.revenue)} (${formatMessage(labels.previous)})`,
        color: 'var(--chart-4)',
      };
    }

    return config;
  }, [data?.compare, formatMessage, labels, colors]);

  const transformedData = useMemo(() => {
    if (!data) return [];

    const visitorsData = generateTimeSeries(data.sessions, minDate, maxDate, unit, dateLocale);
    const revenueData = generateTimeSeries(data.revenue || [], minDate, maxDate, unit, dateLocale);

    if (data.compare) {
      const compareVisitorsData = generateTimeSeries(
        data.compare.sessions,
        minDate,
        maxDate,
        unit,
        dateLocale,
      );
      const compareRevenueData = generateTimeSeries(
        data.compare.revenue || [],
        minDate,
        maxDate,
        unit,
        dateLocale,
      );

      return visitorsData.map((v, i) => ({
        index: i,
        date: v.x,
        value: v.x,
        d: v.d,
        visitors: v.y ?? 0,
        revenue: revenueData[i]?.y ?? 0,
        compareVisitors: compareVisitorsData[i]?.y ?? 0,
        compareRevenue: compareRevenueData[i]?.y ?? 0,
      }));
    }

    return visitorsData.map((v, i) => ({
      index: i,
      date: v.x,
      value: v.x,
      d: v.d,
      visitors: v.y ?? 0,
      revenue: revenueData[i]?.y ?? 0,
    }));
  }, [data, minDate, maxDate, unit, dateLocale]);

  const trendingInfo = useMemo(() => {
    if (!data?.compare || !data.revenue || data.revenue.length === 0) return null;
    const current = data.revenue.reduce((s: number, v: any) => s + (v.y || 0), 0);
    const prev = data.compare.revenue?.reduce((s: number, v: any) => s + (v.y || 0), 0) || 0;

    if (prev === 0) return null;

    const diff = ((current - prev) / prev) * 100;

    return {
      diff: Math.abs(diff).toFixed(1),
      isUp: diff >= 0,
    };
  }, [data]);

  const yKeys = useMemo(() => {
    const keys = ['visitors', 'revenue'];
    if (data?.compare) {
      keys.push('compareVisitors', 'compareRevenue');
    }
    return keys;
  }, [data?.compare]);

  const renderXLabel = useCallback(renderDateLabels(unit, locale), [unit, locale]);

  return (
    <AreaChartInteractive
      data={transformedData}
      config={chartConfig}
      xKey="date"
      yKeys={yKeys}
      renderXLabel={renderXLabel}
      renderYLabel={renderNumberLabels}
      height={400}
      footerTitle={
        trendingInfo && (
          <>
            Trending {trendingInfo.isUp ? 'up' : 'down'} by {trendingInfo.diff}% this period{' '}
            {trendingInfo.isUp ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )}
          </>
        )
      }
    />
  );
}
