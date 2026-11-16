import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useReportsQuery(
  { projectId, type }: { projectId: string; type?: string },
  options?: ReactQueryOptions,
) {
  const { modified } = useModified(`reports:${type}`);
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['reports', { projectId, type, modified }],
    queryFn: async () => get('/reports', { projectId, type }),
    enabled: !!projectId && !!type,
    ...options,
  });
}
