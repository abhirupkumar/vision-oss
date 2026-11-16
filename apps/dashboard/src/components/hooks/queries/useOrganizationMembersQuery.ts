import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useOrganizationMembersQuery(organizationId: string) {
  const { get } = useApi();
  const { modified } = useModified(`organizations:members`);

  return usePagedQuery({
    queryKey: ['organizations:members', { organizationId, modified }],
    queryFn: (params: any) => {
      return get(`/organizations/${organizationId}/users`, params);
    },
    enabled: !!organizationId,
  });
}
