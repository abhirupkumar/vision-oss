import type { Metadata } from 'next';
import { ProjectSettings } from './ProjectSettings';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <ProjectSettings projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Settings',
};
