import { useApi } from '../useApi';

export function useProjectVisitorQuery(projectId: string, visitorId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['visitor', { projectId, visitorId }],
    queryFn: () => {
      return get(`/projects/${projectId}/visitors/${visitorId}`);
    },
    enabled: Boolean(projectId && visitorId),
  });
}
