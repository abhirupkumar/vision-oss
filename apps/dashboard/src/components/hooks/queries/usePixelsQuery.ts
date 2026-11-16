import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function usePixelsQuery(
  { organizationId }: { organizationId?: string },
  options?: ReactQueryOptions,
) {
  const { modified } = useModified('pixels');
  const { get } = useApi();

  return usePagedQuery({
    queryKey: ['pixels', { organizationId, modified }],
    queryFn: pageParams => {
      return get(
        organizationId ? `/organizations/${organizationId}/pixels` : '/pixels',
        pageParams,
      );
    },
    ...options,
  });
}
