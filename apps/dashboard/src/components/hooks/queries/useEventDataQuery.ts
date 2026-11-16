import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useEventDataQuery(projectId: string, eventId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const params = useFilterParameters();

  return useQuery({
    queryKey: [
      'projects:event-data',
      { projectId, eventId, startAt, endAt, unit, timezone, ...params },
    ],
    queryFn: () =>
      get(`/projects/${projectId}/event-data/${eventId}`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...params,
      }),
    enabled: !!(projectId && eventId),
    ...options,
  });
}
