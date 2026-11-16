import { useApi } from '../useApi';

export function useProjectSessionQuery(projectId: string, sessionId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['session', { projectId, sessionId }],
    queryFn: () => {
      return get(`/projects/${projectId}/sessions/${sessionId}`);
    },
    enabled: Boolean(projectId && sessionId),
  });
}
