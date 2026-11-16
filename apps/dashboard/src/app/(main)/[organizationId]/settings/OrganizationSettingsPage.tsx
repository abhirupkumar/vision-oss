'use client';
import { useNavigation } from '@/components/hooks';
import { OrganizationProvider } from '../organizations/OrganizationProvider';
import { OrganizationSettings } from '../organizations/OrganizationSettings';

export function OrganizationSettingsPage() {
  const { organizationId } = useNavigation();

  return (
    <OrganizationProvider organizationId={organizationId}>
      <OrganizationSettings organizationId={organizationId} />
    </OrganizationProvider>
  );
}
