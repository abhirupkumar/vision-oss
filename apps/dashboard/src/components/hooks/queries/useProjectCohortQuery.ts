import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useProjectCohortQuery(
  projectId: string,
  cohortId: string,
  options?: ReactQueryOptions,
) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`cohorts`);

  return useQuery({
    queryKey: ['project:cohorts', { projectId, cohortId, modified }],
    queryFn: () => get(`/projects/${projectId}/segments/${cohortId}`),
    enabled: !!(projectId && cohortId),
    placeholderData: keepPreviousData,
    ...options,
  });
}
