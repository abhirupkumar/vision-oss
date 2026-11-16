import type { Metadata } from 'next';
import { AdminProjectsPage } from './AdminProjectsPage';

export default function () {
  return <AdminProjectsPage />;
}
export const metadata: Metadata = {
  title: 'Projects',
};
