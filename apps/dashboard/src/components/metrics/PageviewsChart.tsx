import { TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { AreaChartInteractive } from '@/components/charts/AreaChartInteractive';
import { useLocale, useMessages, useTheme } from '@/components/hooks';
import type { ChartConfig } from '@/components/ui/chart';
import { renderDateLabels, renderNumberLabels } from '@/lib/charts';
import { getThemeColors } from '@/lib/colors';
import { DATE_FORMATS, formatDate, generateTimeSeries } from '@/lib/date';

export interface PageviewsChartProps {
  data: {
    pageviews: any[];
    sessions: any[];
    compare?: {
      pageviews: any[];
      sessions: any[];
    };
  };
  unit: string;
  minDate: Date;
  maxDate: Date;
}

export function PageviewsChart({ data, unit, minDate, maxDate }: PageviewsChartProps) {
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
      views: {
        label: formatMessage(labels.views),
        color: colors.chart.views.borderColor,
      },
    };

    if (data?.compare) {
      config.compareVisitors = {
        label: `${formatMessage(labels.visitors)} (${formatMessage(labels.previous)})`,
        color: 'var(--chart-3)',
      };
      config.compareViews = {
        label: `${formatMessage(labels.views)} (${formatMessage(labels.previous)})`,
        color: 'var(--chart-4)',
      };
    }

    return config;
  }, [data?.compare, formatMessage, labels]);

  const transformedData = useMemo(() => {
    if (!data) return [];

    const visitorsData = generateTimeSeries(data.sessions, minDate, maxDate, unit, dateLocale);
    const viewsData = generateTimeSeries(data.pageviews, minDate, maxDate, unit, dateLocale);

    if (data.compare) {
      const compareVisitorsData = generateTimeSeries(
        data.compare.sessions,
        minDate,
        maxDate,
        unit,
        dateLocale,
      );
      const compareViewsData = generateTimeSeries(
        data.compare.pageviews,
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
        visitors: v.y,
        views: viewsData[i].y,
        compareVisitors: compareVisitorsData[i]?.y ?? null,
        compareViews: compareViewsData[i]?.y ?? null,
      }));
    }

    return visitorsData.map((v, i) => ({
      index: i,
      date: v.x,
      value: v.x,
      d: v.d,
      visitors: v.y,
      views: viewsData[i].y,
    }));
  }, [data, minDate, maxDate, unit, dateLocale]);

  const trendingInfo = useMemo(() => {
    if (!data?.compare || data.pageviews.length === 0) return null;
    const current = data.pageviews.reduce((s, v) => s + (v.y || 0), 0);
    const prev = data.compare.pageviews.reduce((s, v) => s + (v.y || 0), 0);

    if (prev === 0) return null;

    const diff = ((current - prev) / prev) * 100;

    return {
      diff: Math.abs(diff).toFixed(1),
      isUp: diff >= 0,
    };
  }, [data]);

  const yKeys = useMemo(() => {
    const keys = ['visitors', 'views'];
    if (data?.compare) {
      keys.push('compareVisitors', 'compareViews');
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
