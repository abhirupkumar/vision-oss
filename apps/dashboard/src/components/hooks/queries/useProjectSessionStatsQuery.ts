import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useProjectSessionStatsQuery(projectId: string, options?: Record<string, string>) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery({
    queryKey: ['sessions:stats', { projectId, startAt, endAt, unit, timezone, ...filters }],
    queryFn: () =>
      get(`/projects/${projectId}/sessions/stats`, { startAt, endAt, unit, timezone, ...filters }),
    enabled: !!projectId,
    ...options,
  });
}
