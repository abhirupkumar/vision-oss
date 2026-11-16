import { useApi } from '../useApi';
import { useDateParameters } from '../useDateParameters';
import { useFilterParameters } from '../useFilterParameters';
import { useModified } from '../useModified';

export function usePerformanceQuery(
  projectId: string,
  metric: string = 'lcp',
  params?: Record<string, string | number>,
) {
  const { post, useQuery } = useApi();
  const { modified } = useModified(`performance`);
  const { startAt, endAt, unit, timezone } = useDateParameters();
  const filters = useFilterParameters();

  return useQuery({
    queryKey: [
      'performance',
      { projectId, metric, modified, startAt, endAt, unit, timezone, ...params, ...filters },
    ],
    queryFn: () =>
      post('/reports/performance', {
        projectId,
        parameters: {
          startDate: startAt,
          endDate: endAt,
          unit,
          timezone,
          metric,
        },
        filters,
      }),
  });
}
