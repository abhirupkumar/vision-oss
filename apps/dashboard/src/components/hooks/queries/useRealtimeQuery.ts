import { REALTIME_INTERVAL } from '@/lib/constants';
import type { RealtimeData } from '@/lib/types';
import { useApi } from '../useApi';

export function useRealtimeQuery(projectId: string) {
  const { get, useQuery } = useApi();
  const { data, isLoading, error } = useQuery<RealtimeData>({
    queryKey: ['realtime', { projectId }],
    queryFn: async () => {
      return get(`/realtime/${projectId}`);
    },
    enabled: !!projectId,
    refetchInterval: REALTIME_INTERVAL,
  });

  return { data, isLoading, error };
}
