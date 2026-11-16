'use client';
import { OrganizationProvider } from '@/app/(main)/[organizationId]/organizations/OrganizationProvider';
import { OrganizationSettings } from '@/app/(main)/[organizationId]/organizations/OrganizationSettings';

export function AdminOrganizationPage({ organizationId }: { organizationId: string }) {
  return (
    <OrganizationProvider organizationId={organizationId}>
      <OrganizationSettings organizationId={organizationId} />
    </OrganizationProvider>
  );
}
