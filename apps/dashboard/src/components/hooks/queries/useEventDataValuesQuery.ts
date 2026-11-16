import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useEventDataValuesQuery(
  projectId: string,
  event: string,
  propertyName: string,
  options?: ReactQueryOptions,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<any>({
    queryKey: [
      'projects:event-data:values',
      { projectId, event, propertyName, startAt, endAt, unit, timezone, ...filters },
    ],
    queryFn: () =>
      get(`/projects/${projectId}/event-data/values`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        event,
        propertyName,
      }),
    enabled: !!(projectId && propertyName),
    ...options,
  });
}
