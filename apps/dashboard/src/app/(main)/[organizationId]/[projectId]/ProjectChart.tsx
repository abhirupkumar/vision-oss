'use client';
import { useMemo } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useDateRange, useTimezone } from '@/components/hooks';
import { useProjectPageviewsQuery } from '@/components/hooks/queries/useProjectPageviewsQuery';
import { ProjectMetricsChart } from '@/components/metrics/ProjectMetricsChart';

export function ProjectChart({
  projectId,
  compareMode,
  initialData,
}: {
  projectId: string;
  compareMode?: boolean;
  initialData?: any;
}) {
  const { timezone } = useTimezone();
  const { dateRange, dateCompare } = useDateRange({ timezone: timezone });
  const { startDate, endDate, unit, value } = dateRange;
  const { data, isLoading, isFetching, error } = useProjectPageviewsQuery(
    {
      projectId,
      compare: compareMode ? dateCompare?.compare : undefined,
    },
    { initialData },
  );
  const { pageviews, sessions, revenue, compare } = (data || {}) as any;

  const chartData = useMemo(() => {
    if (data) {
      const result: any = {
        pageviews,
        sessions,
        revenue,
      };

      if (compare) {
        result.compare = {
          pageviews: result.pageviews.map(({ x }, i) => ({
            x,
            y: compare.pageviews[i]?.y,
            d: compare.pageviews[i]?.x,
          })),
          sessions: result.sessions.map(({ x }, i) => ({
            x,
            y: compare.sessions[i]?.y,
            d: compare.sessions[i]?.x,
          })),
          revenue: result.revenue?.map(({ x }, i) => ({
            x,
            y: compare.revenue[i]?.y,
            d: compare.revenue[i]?.x,
          })),
        };
      }

      return result;
    }
    return { pageviews: [], sessions: [] };
  }, [data, startDate, endDate, unit]);

  return (
    <LoadingPanel data={data} isFetching={isFetching} isLoading={isLoading} error={error}>
      <ProjectMetricsChart
        key={value}
        data={chartData}
        minDate={startDate}
        maxDate={endDate}
        unit={unit}
      />
    </LoadingPanel>
  );
}
