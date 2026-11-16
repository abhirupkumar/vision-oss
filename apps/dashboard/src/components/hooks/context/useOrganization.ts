import { useContext } from 'react';
import { OrganizationContext } from '@/app/(main)/[organizationId]/organizations/OrganizationProvider';

export function useOrganization() {
  return useContext(OrganizationContext);
}
