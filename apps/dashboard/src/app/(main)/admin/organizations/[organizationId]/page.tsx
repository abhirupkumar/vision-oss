import type { Metadata } from 'next';
import { AdminOrganizationPage } from './AdminOrganizationPage';

export default async function ({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;

  return <AdminOrganizationPage organizationId={organizationId} />;
}

export const metadata: Metadata = {
  title: 'Organization',
};
