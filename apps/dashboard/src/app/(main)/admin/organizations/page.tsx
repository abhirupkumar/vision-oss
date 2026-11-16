import type { Metadata } from 'next';
import { AdminOrganizationsPage } from './AdminOrganizationsPage';

export default function () {
  return <AdminOrganizationsPage />;
}
export const metadata: Metadata = {
  title: 'Organizations',
};
