import type { Metadata } from 'next';
import { OrganizationsPage } from './OrganizationsPage';

export default function () {
  return <OrganizationsPage />;
}

export const metadata: Metadata = {
  title: 'Organizations',
};
