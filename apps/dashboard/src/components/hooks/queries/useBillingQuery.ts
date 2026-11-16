import { keepPreviousData } from '@tanstack/react-query';
import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';

export function useBillingQuery(organizationId?: string, options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { modified } = useModified(`billing:${organizationId || 'universal'}`);

  return useQuery({
    queryKey: ['billing', { organizationId: organizationId || 'universal', modified }],
    queryFn: () =>
      organizationId
        ? get(`/organizations/${organizationId}/billing`)
        : get('/me/billing'),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useUniversalBillingQuery(options?: ReactQueryOptions) {
  const { get, useQuery } = useApi();
  const { modified } = useModified('billing:universal');

  return useQuery({
    queryKey: ['billing', { type: 'universal', modified }],
    queryFn: () => get('/me/billing'),
    placeholderData: keepPreviousData,
    ...options,
  });
}
