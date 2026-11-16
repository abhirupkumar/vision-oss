import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useUserProjectsQuery(
  { userId, organizationId }: { userId?: string; organizationId?: string },
  params?: Record<string, any>,
  options?: ReactQueryOptions,
) {
  const { get } = useApi();
  const { modified } = useModified(`projects`);

  return usePagedQuery({
    queryKey: ['projects', { userId, organizationId, modified, ...params }],
    queryFn: pageParams => {
      return get(
        organizationId
          ? `/organizations/${organizationId}/projects`
          : userId
            ? `/users/${userId}/projects`
            : '/me/projects',
        {
          ...pageParams,
          ...params,
        },
      );
    },
    ...options,
  });
}
