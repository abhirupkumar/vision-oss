import { useApi } from '../useApi';

export function useReplayChunksQuery(projectId: string, sessionId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['replay-chunks', { projectId, sessionId }],
    queryFn: () => get(`/projects/${projectId}/replays/${sessionId}/chunks`),
  });
}
