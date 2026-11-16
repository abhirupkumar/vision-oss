'use client';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useDateRange, useMessages } from '@/components/hooks';
import { useProjectPageviewsQuery } from '@/components/hooks/queries/useProjectPageviewsQuery';
import { useProjectStatsQuery } from '@/components/hooks/queries/useProjectStatsQuery';
import { useRealtimeQuery } from '@/components/hooks/queries/useRealtimeQuery';
import { MetricCard } from '@/components/metrics/MetricCard';
import { MetricsBar } from '@/components/metrics/MetricsBar';
import { formatLongNumber, formatShortTime } from '@/lib/format';

export function ProjectMetricsBar({
  projectId,
  initialData,
  compareMode,
}: {
  projectId: string;
  showChange?: boolean;
  compareMode?: boolean;
  initialData?: any;
}) {
  const { isAllTime, dateCompare } = useDateRange();
  const { formatMessage, labels, getErrorMessage } = useMessages();

  const { data, isLoading, isFetching, error } = useProjectStatsQuery(projectId, {
    initialData: initialData as any,
  });
  const { data: pageviewsData } = useProjectPageviewsQuery({
    projectId,
    compare: compareMode ? dateCompare?.compare : undefined,
  });
  const { data: realtimeData } = useRealtimeQuery(projectId);

  const {
    pageviews,
    visitors,
    visits,
    bounces,
    totaltime,
    revenue,
    comparison,
    visits_with_duration,
  } = data || {};

  const pageviewsSeries = pageviewsData?.pageviews || [];
  const sessionsSeries = pageviewsData?.sessions || [];
  const revenueSeries = pageviewsData?.revenue || [];
  const realtimeSeries = realtimeData?.series?.views || [];

  const sumVisitors = sessionsSeries.reduce((acc, s) => acc + (Number(s.visitors) || 0), 0);
  const sumPageviews = pageviewsSeries.reduce((acc, p) => acc + (Number(p.y) || 0), 0);

  const metrics = data
    ? [
        {
          value: sumVisitors,
          label: 'Unique visitors',
          change: sumVisitors - (comparison?.visitors || 0),
          formatValue: formatLongNumber,
          chartData: sessionsSeries.map(s => ({ x: s.x, y: Number(s.visitors) || 0 })),
        },
        {
          value: visits,
          label: 'Sessions',
          change: visits - (comparison?.visits || 0),
          formatValue: formatLongNumber,
          chartData: sessionsSeries.map(s => ({ x: s.x, y: Number(s.y) || 0 })),
        },
        {
          value: sumPageviews,
          label: 'Page views',
          change: sumPageviews - (comparison?.pageviews || 0),
          formatValue: formatLongNumber,
          chartData: pageviewsSeries.map(p => ({ x: p.x, y: Number(p.y) || 0 })),
        },
        {
          label: 'Pages per session',
          value: visits > 0 ? pageviews / visits : 0,
          prev: comparison?.visits > 0 ? comparison.pageviews / comparison.visits : 0,
          change:
            (visits > 0 ? pageviews / visits : 0) -
            (comparison?.visits > 0 ? comparison.pageviews / comparison.visits : 0),
          formatValue: n => `${Math.round(+n * 10) / 10}`,
          chartData: sessionsSeries.map(s => {
            const pv = pageviewsSeries.find(p => p.x === s.x);
            return {
              x: s.x,
              y: Number(s.y) > 0 && pv?.y ? Number(pv.y) / Number(s.y) : 0,
            };
          }),
        },
        {
          label: formatMessage(labels.bounceRate),
          value: visits > 0 ? (Math.min(visits, bounces) / visits) * 100 : 0,
          prev:
            comparison?.visits > 0
              ? (Math.min(comparison.visits, comparison.bounces) / comparison.visits) * 100
              : 0,
          change:
            (visits > 0 ? (Math.min(visits, bounces) / visits) * 100 : 0) -
            (comparison?.visits > 0
              ? (Math.min(comparison.visits, comparison.bounces) / comparison.visits) * 100
              : 0),
          formatValue: n => `${Math.round(+n)}%`,
          reverseColors: true,
          isPercentage: true,
          chartData: sessionsSeries.map(s => ({
            x: s.x,
            y: Number(s.y) > 0 ? (Math.min(Number(s.y), Number(s.bounces) || 0) / Number(s.y)) * 100 : 0,
          })),
        },
        {
          label: 'Session Duration',
          value: visits_with_duration > 0 ? totaltime / visits_with_duration : 0,
          prev:
            comparison?.visits_with_duration > 0
              ? comparison.totaltime / comparison.visits_with_duration
              : 0,
          change:
            (visits_with_duration > 0 ? totaltime / visits_with_duration : 0) -
            (comparison?.visits_with_duration > 0
              ? comparison.totaltime / comparison.visits_with_duration
              : 0),
          formatValue: n =>
            `${+n < 0 ? '-' : ''}${formatShortTime(Math.abs(~~n), ['m', 's'], ' ')}`,
          chartData: sessionsSeries.map(s => ({
            x: s.x,
            y: Number(s.visits_with_duration) > 0 ? (Number(s.totaltime) || 0) / Number(s.visits_with_duration) : 0,
          })),
        },
        {
          label: 'Revenue',
          value: revenue || 0,
          change: (revenue || 0) - (comparison?.revenue || 0),
          formatValue: n =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(n),
          chartData: revenueSeries,
        },
        (data.llmCost && data.llmCost > 0) || (data.llmTokens && data.llmTokens > 0)
          ? {
              label: 'LLM Spend',
              value: data.llmCost || 0,
              change: 0,
              formatValue: (n: number) => `$${Number(n).toFixed(2)}`,
              chartColor: 'orange',
              showChange: false,
            }
          : {
              label: 'Sessions last 30 min',
              value: realtimeData?.totals?.visitors || 0,
              change: 0,
              formatValue: formatLongNumber,
              chartData: realtimeSeries,
              chartColor: 'blue',
              showChange: false,
            },
      ]
    : null;

  return (
    <LoadingPanel
      data={metrics}
      isLoading={isLoading}
      isFetching={isFetching}
      error={getErrorMessage(error)}
      minHeight="136px"
    >
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))' }}>
        {metrics?.map((metric: any) => {
          return (
            <MetricCard
              key={metric.label}
              value={metric.value}
              previousValue={metric.prev}
              label={metric.label}
              change={metric.change}
              formatValue={metric.formatValue}
              reverseColors={metric.reverseColors}
              showChange={metric.showChange !== false && !isAllTime}
              chartData={metric.chartData}
              chartColor={metric.chartColor}
              isPercentage={metric.isPercentage}
            />
          );
        })}
      </div>
    </LoadingPanel>
  );
}
