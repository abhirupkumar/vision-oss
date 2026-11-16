'use client';
import { Loading } from '@umami/react-zen';
import { createContext, type ReactNode } from 'react';
import { useOrganizationQuery } from '@/components/hooks/queries/useOrganizationQuery';
export type Organization = any;

export const OrganizationContext = createContext<Organization>(null);

export function OrganizationProvider({
  organizationId,
  children,
}: {
  organizationId?: string;
  children: ReactNode;
}) {
  const { data: organization, isLoading, isFetching } = useOrganizationQuery(organizationId);

  if (isFetching && isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <OrganizationContext.Provider value={organization}>{children}</OrganizationContext.Provider>
  );
}
