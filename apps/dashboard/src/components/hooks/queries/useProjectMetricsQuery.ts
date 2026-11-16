import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export type ProjectMetricsData = {
  x: string;
  y: number;
}[];

export function useProjectMetricsQuery(
  projectId: string,
  params: { type: string; limit?: number; search?: string },
  options?: ReactQueryOptions<ProjectMetricsData>,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<ProjectMetricsData>({
    queryKey: [
      'projects:metrics',
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
      get(`/projects/${projectId}/metrics`, {
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
