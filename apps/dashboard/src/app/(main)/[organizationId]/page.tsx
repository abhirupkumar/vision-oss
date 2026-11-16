import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { ProjectsPage } from './ProjectsPage';

export default async function ({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  return <ProjectsPage />;
}

export const metadata: Metadata = {
  title: 'Projects',
};
