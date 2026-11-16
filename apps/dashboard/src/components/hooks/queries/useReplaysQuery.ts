import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useReplaysQuery(projectId: string, params?: Record<string, string | number>) {
  const { get } = useApi();
  const { modified } = useModified(`replays`);
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return usePagedQuery({
    queryKey: [
      'replays',
      { projectId, modified, startAt, endAt, unit, timezone, ...params, ...filters },
    ],
    queryFn: pageParams => {
      return get(`/projects/${projectId}/replays`, {
        startAt,
        endAt,
        unit,
        timezone,
        ...filters,
        ...pageParams,
        ...params,
        pageSize: 20,
      });
    },
  });
}
