import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useOrganizationQuery(organizationId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`organizations:${organizationId}`);

  return useQuery({
    queryKey: ['organizations', { organizationId, modified }],
    queryFn: () => get(`/organizations/${organizationId}`),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    ...options,
  });
}
