import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useProjectSegmentQuery(
  projectId: string,
  segmentId: string,
  options?: ReactQueryOptions,
) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`segments`);

  return useQuery({
    queryKey: ['project:segments', { projectId, segmentId, modified }],
    queryFn: () => get(`/projects/${projectId}/segments/${segmentId}`),
    enabled: !!(projectId && segmentId),
    placeholderData: keepPreviousData,
    ...options,
  });
}
