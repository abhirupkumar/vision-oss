import { setUser, useApp } from '@/store/app';
import { useApi } from '../useApi';
import { useAuth } from '@clerk/nextjs';

const selector = (state: { user: any }) => state.user;

export function useLoginQuery() {
  const { post, useQuery } = useApi();
  const user = useApp(selector);
  const { isLoaded, isSignedIn } = useAuth();

  const query = useQuery({
    queryKey: ['login'],
    queryFn: async () => {
      const data = await post('/auth/verify');

      setUser(data);

      return data;
    },
    enabled: !user && isLoaded && isSignedIn,
    retry: false,
  });

  // If clerk is loaded and user is explicitly not signed in, we can immediately return an error state
  // or just let it be. We'll return a pseudo-isLoading state if not loaded.
  const isLoading = query.isLoading || !isLoaded || (isSignedIn && !user && query.isPending);

  return { user, setUser, ...query, isLoading };
}
