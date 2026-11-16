import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useUserOrganizationsQuery(userId: string) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`organizations`);

  return useQuery({
    queryKey: ['organizations', { userId, modified }],
    queryFn: () => {
      return get(`/users/${userId}/organizations`);
    },
    enabled: !!userId,
  });
}
