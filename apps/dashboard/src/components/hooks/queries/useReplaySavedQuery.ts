import { useApi } from '../useApi';

export function useReplaySavedQuery(projectId: string, visitId: string) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['replay-saved', { projectId, visitId }],
    queryFn: () => get(`/projects/${projectId}/replays/saved`, { visitId }),
  });
}
