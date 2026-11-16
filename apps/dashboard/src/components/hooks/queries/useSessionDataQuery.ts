import { useApi } from '../useApi';

export function useSessionDataQuery(projectId: string, sessionId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['session:data', { projectId, sessionId }],
    queryFn: () => {
      return get(`/projects/${projectId}/sessions/${sessionId}/properties`, { projectId });
    },
  });
}
