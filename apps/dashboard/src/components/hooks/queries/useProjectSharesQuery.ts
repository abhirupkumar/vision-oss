import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useProjectSharesQuery(projectId: string, params?: Record<string, string | number>) {
  const { get } = useApi();
  const { modified } = useModified(`shares`);

  return usePagedQuery({
    queryKey: ['shares', { projectId, modified, ...params }],
    queryFn: pageParams => {
      return get(`/projects/${projectId}/shares`, {
        ...pageParams,
        ...params,
        pageSize: 20,
      });
    },
  });
}
