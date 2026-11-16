import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useSessionDataValuesQuery(
  projectId: string,
  propertyName: string,
  options?: ReactQueryOptions,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<any>({
    queryKey: [
      'projects:session-data:values',
      { projectId, propertyName, startAt, endAt, unit, timezone, ...filters },
    ],
    queryFn: () =>
      get(`/projects/${projectId}/session-data/values`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        propertyName,
      }),
    enabled: !!(projectId && propertyName),
    ...options,
  });
}
