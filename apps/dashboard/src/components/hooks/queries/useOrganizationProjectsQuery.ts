import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useOrganizationProjectsQuery(organizationId: string) {
  const { get } = useApi();
  const { modified } = useModified(`projects`);

  return usePagedQuery({
    queryKey: ['organizations:projects', { organizationId, modified }],
    queryFn: (params: any) => {
      return get(`/organizations/${organizationId}/projects`, params);
    },
  });
}
