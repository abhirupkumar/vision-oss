import type { Metadata } from 'next';
import { RealtimePage } from './RealtimePage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <RealtimePage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Real-time',
};
