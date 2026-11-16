import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useOrganizationInvitesQuery(organizationId: string) {
  const { get } = useApi();
  const { modified } = useModified(`organizations:invites`);

  return usePagedQuery({
    queryKey: ['organizations:invites', { organizationId, modified }],
    queryFn: (params: any) => {
      return get(`/organizations/${organizationId}/invites`, params);
    },
    enabled: !!organizationId,
  });
}
