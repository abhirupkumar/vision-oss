import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export type ProjectExpandedMetricsData = {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}[];

export function useProjectExpandedMetricsQuery(
  projectId: string,
  params: { type: string; limit?: number; search?: string },
  options?: ReactQueryOptions<ProjectExpandedMetricsData>,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<ProjectExpandedMetricsData>({
    queryKey: [
      'projects:metrics:expanded',
      {
        projectId,
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        ...params,
      },
    ],
    queryFn: async () =>
      get(`/projects/${projectId}/metrics/expanded`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        ...params,
      }),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    ...options,
  });
}
