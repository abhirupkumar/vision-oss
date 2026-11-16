import type { Metadata } from 'next';
import { CohortsPage } from './CohortsPage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <CohortsPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Cohorts',
};
