import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useSavedReplaysQuery(projectId: string, params?: Record<string, string | number>) {
  const { get } = useApi();
  const { modified } = useModified(`saved-replays`);

  return usePagedQuery({
    queryKey: ['saved-replays', { projectId, modified, ...params }],
    queryFn: async pageParams => {
      try {
        return await get(`/projects/${projectId}/replays/saved`, {
          ...pageParams,
          ...params,
          pageSize: 20,
        });
      } catch (e: any) {
        if (e.status === 404) {
          return { data: [], count: 0, page: 1, pageSize: 20 };
        }
        throw e;
      }
    },
  });
}
