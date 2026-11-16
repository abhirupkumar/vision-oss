import { useApi } from '../useApi';

export function useVisitorActivityQuery(projectId: string, visitorId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['visitor:activity', { projectId, visitorId }],
    queryFn: () => {
      return get(`/projects/${projectId}/visitors/${visitorId}/activity`);
    },
    enabled: Boolean(projectId && visitorId),
  });
}
