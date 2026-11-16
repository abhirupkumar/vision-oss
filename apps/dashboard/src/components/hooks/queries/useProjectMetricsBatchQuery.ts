import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

import type { ProjectMetricsData } from './useProjectMetricsQuery';

export type ProjectMetricsBatchData = Record<string, ProjectMetricsData>;

export function useProjectMetricsBatchQuery(
  projectId: string,
  params: { types: string[]; limit?: number; search?: string },
  options?: ReactQueryOptions<ProjectMetricsBatchData>,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  // Sort types so the query key is consistent regardless of order
  const typesString = [...params.types].sort().join(',');

  return useQuery<ProjectMetricsBatchData>({
    queryKey: [
      'projects:metrics:batch',
      {
        projectId,
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        limit: params.limit,
        search: params.search,
        types: typesString,
      },
    ],
    queryFn: async () =>
      get(`/projects/${projectId}/metrics/batch`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        limit: params.limit,
        search: params.search,
        types: typesString,
      }),
    enabled: !!projectId && params.types.length > 0,
    placeholderData: keepPreviousData,
    ...options,
  });
}
