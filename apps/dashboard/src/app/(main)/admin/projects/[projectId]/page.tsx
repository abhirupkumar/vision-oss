import type { Metadata } from 'next';
import { ProjectSettings } from '@/app/(main)/[organizationId]/[projectId]/settings/ProjectSettings';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <ProjectSettings projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Project',
};
