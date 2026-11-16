import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';

export function useProjectErrorSummaryQuery(
  projectId: string,
  options?: ReactQueryOptions<any>,
) {
  const { get, useQuery } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery({
    queryKey: [
      'projects:errors:summary',
      { projectId, startAt, endAt, unit, timezone, ...filters },
    ],
    queryFn: async () =>
      get(`/projects/${projectId}/errors/summary`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
      }),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    ...options,
  });
}
