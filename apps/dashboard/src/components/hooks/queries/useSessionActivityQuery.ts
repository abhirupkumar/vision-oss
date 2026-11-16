import { useApi } from '../useApi';

export function useSessionActivityQuery(
  projectId: string,
  sessionId: string,
  startDate: Date,
  endDate: Date,
) {
  const { get, useQuery } = useApi();

  return useQuery({
    queryKey: ['session:activity', { projectId, sessionId, startDate, endDate }],
    queryFn: () => {
      return get(`/projects/${projectId}/sessions/${sessionId}/activity`, {
        startAt: +new Date(startDate),
        endAt: +new Date(endDate),
      });
    },
    enabled: Boolean(projectId && sessionId && startDate && endDate),
  });
}
