import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useModified } from '../useModified';

export function useWeeklyTrafficQuery(projectId: string, params?: Record<string, string | number>) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`sessions`);
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery({
    queryKey: [
      'sessions',
      { projectId, modified, startAt, endAt, unit, timezone, ...params, ...filters },
    ],
    queryFn: () => {
      return get(`/projects/${projectId}/sessions/weekly`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...params,
        ...filters,
      });
    },
  });
}
