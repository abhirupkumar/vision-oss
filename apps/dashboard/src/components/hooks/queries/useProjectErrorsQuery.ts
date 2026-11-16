import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';
import { usePagedQuery } from '../usePagedQuery';

export function useProjectErrorsQuery(
  projectId: string,
  params?: Record<string, any>,
  options?: ReactQueryOptions,
) {
  const { get } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return usePagedQuery({
    queryKey: [
      'projects:errors',
      { projectId, startAt, endAt, unit, timezone, ...filters, ...params },
    ],
    queryFn: pageParams =>
      get(`/projects/${projectId}/errors`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        ...pageParams,
        ...params,
      }),
    enabled: !!projectId,
    ...options,
  });
}
