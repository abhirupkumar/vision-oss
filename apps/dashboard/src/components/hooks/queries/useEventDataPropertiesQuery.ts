import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useEventDataPropertiesQuery(projectId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<any>({
    queryKey: [
      'projects:event-data:properties',
      { projectId, startAt, endAt, unit, timezone, ...filters },
    ],
    queryFn: () =>
      get(`/projects/${projectId}/event-data/properties`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
      }),
    enabled: !!projectId,
    ...options,
  });
}
