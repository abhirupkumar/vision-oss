import type { Metadata } from 'next';
import { ProjectPage } from './ProjectPage';

export default async function ({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<any>;
}) {
  const { projectId } = await params;
  return <ProjectPage projectId={projectId} searchParams={searchParams} />;
}

export const metadata: Metadata = {
  title: 'Projects',
};
