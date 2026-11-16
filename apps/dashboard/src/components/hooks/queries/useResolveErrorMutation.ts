import { useApi } from '../useApi';

export function useResolveErrorMutation() {
  const { post, useMutation } = useApi();

  return useMutation({
    mutationFn: (data: { projectId: string; fingerprint: string }) => {
      return post(`/projects/${data.projectId}/errors/groups/${data.fingerprint}`);
    },
  });
}
