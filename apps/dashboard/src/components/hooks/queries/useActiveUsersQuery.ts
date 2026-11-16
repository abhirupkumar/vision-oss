import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';

export function useActyiveUsersQuery(projectId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  return useQuery<any>({
    queryKey: ['projects:active', projectId],
    queryFn: () => get(`/projects/${projectId}/active`),
    enabled: !!projectId,
    ...options,
  });
}
