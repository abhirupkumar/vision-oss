import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useLinksQuery(
  { organizationId }: { organizationId?: string },
  options?: ReactQueryOptions,
) {
  const { modified } = useModified('links');
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['links', { organizationId, modified }],
    queryFn: pageParams => {
      return get(organizationId ? `/organizations/${organizationId}/links` : '/links', pageParams);
    },
    ...options,
  });
}
