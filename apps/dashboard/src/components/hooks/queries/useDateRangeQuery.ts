import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';

type DateRange = {
  startDate?: string;
  endDate?: string;
};

export function useDateRangeQuery(projectId: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();

  const { data } = useQuery<DateRange>({
    queryKey: ['date-range', projectId],
    queryFn: () => get(`/projects/${projectId}/daterange`),
    enabled: !!projectId,
    ...options,
  });

  return {
    startDate: data?.startDate ? new Date(data.startDate) : null,
    endDate: data?.endDate ? new Date(data.endDate) : null,
  };
}
