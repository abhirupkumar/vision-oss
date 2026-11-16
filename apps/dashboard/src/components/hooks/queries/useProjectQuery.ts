import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useProjectQuery(projectId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`project:${projectId}`);

  return useQuery({
    queryKey: ['project', { projectId, modified }],
    queryFn: () => get(`/projects/${projectId}`),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    ...options,
  });
}
