import { keepPreviousData } from '@tanstack/react-query';
import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useProjectCohortsQuery(
  projectId: string,
  params?: Record<string, string>,
  options?: ReactQueryOptions,
) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`cohorts`);
  const filters = useFilterParameters();

  return useQuery({
    queryKey: ['project:cohorts', { projectId, modified, ...filters, ...params }],
    queryFn: pageParams => {
      return get(`/projects/${projectId}/segments`, { ...pageParams, ...filters, ...params });
    },
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    ...options,
  });
}
