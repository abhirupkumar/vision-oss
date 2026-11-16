import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export function useInsightConfigQuery(projectId: string) {
  const { get } = useApi();

  return useQuery({
    queryKey: ['insights-config', projectId],
    queryFn: () => get(`/insights/config`, { projectId }),
    enabled: !!projectId,
  });
}
