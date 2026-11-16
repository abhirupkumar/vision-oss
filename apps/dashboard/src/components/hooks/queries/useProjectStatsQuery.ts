import type { UseQueryOptions } from '@tanstack/react-query';
import { useDateParameters } from '@/components/hooks/useDateParameters';
import { useApi } from '../useApi';
import { useFilterParameters } from '../useFilterParameters';

export interface ProjectStatsData {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  revenue: number;
  visits_with_duration: number;
  llmCost?: number;
  llmTokens?: number;
  llmAvgLatency?: number;
  comparison: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
    revenue: number;
    visits_with_duration: number;
  };
}

export function useProjectStatsQuery(
  projectId: string,
  options?: Omit<UseQueryOptions<ProjectStatsData, Error, ProjectStatsData>, 'queryKey'>,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<ProjectStatsData>({
    queryKey: ['projects:stats', { projectId, startAt, endAt, unit, timezone, ...filters }],
    queryFn: () =>
      get(`/projects/${projectId}/stats`, { startAt, endAt, unit, timezone, ...filters }),
    enabled: !!projectId,
    ...options,
  });
}
