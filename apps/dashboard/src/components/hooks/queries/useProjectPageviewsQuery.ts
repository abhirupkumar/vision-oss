import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export interface ProjectPageviewsData {
  pageviews: { x: string; y: number }[];
  sessions: {
    x: string;
    y: number;
    visitors: number;
    bounces: number;
    totaltime: number;
    visits_with_duration: number;
  }[];
  revenue: { x: string; y: number }[];
}

export function useProjectPageviewsQuery(
  { projectId, compare }: { projectId: string; compare?: string },
  options?: ReactQueryOptions<ProjectPageviewsData>,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const queryParams = useFilterParameters();

  return useQuery<ProjectPageviewsData>({
    queryKey: [
      'projects:pageviews',
      { projectId, compare, startAt, endAt, unit, timezone, ...queryParams },
    ],
    queryFn: () =>
      get(`/projects/${projectId}/pageviews`, {
        compare,
        startAt,
        endAt,
        unit,
        timezone,
        ...queryParams,
      }),
    enabled: !!projectId,
    ...options,
  });
}
