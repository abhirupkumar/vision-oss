import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';
import { usePagedQuery } from '../usePagedQuery';

const EVENT_TYPES = {
  views: 1,
  events: 2,
};

export function useProjectEventsQuery(
  projectId: string,
  params?: Record<string, any>,
  options?: ReactQueryOptions,
) {
  const { get } = useApi();
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return usePagedQuery({
    queryKey: [
      'projects:events',
      { projectId, startAt, endAt, unit, timezone, ...filters, ...params },
    ],
    queryFn: pageParams =>
      get(`/projects/${projectId}/events`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        ...pageParams,
        ...params,
        eventType: EVENT_TYPES[params.view],
      }),
    enabled: !!projectId,
    ...options,
  });
}
