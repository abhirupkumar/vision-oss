import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useProjectsQuery(params?: Record<string, any>, options?: ReactQueryOptions) {
  const { get } = useApi();
  const { modified } = useModified(`projects`);

  return usePagedQuery({
    queryKey: ['projects:admin', { modified, ...params }],
    queryFn: pageParams => {
      return get(`/admin/projects`, {
        ...pageParams,
        ...params,
      });
    },
    ...options,
  });
}
