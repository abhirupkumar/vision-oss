import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useSessionDataPropertiesQuery(projectId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery<any>({
    queryKey: [
      'projects:session-data:properties',
      { projectId, startAt, endAt, unit, timezone, ...filters },
    ],
    queryFn: () =>
      get(`/projects/${projectId}/session-data/properties`, {
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
