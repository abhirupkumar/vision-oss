import type { Metadata } from 'next';
import { PerformancePage } from './PerformancePage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <PerformancePage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Performance',
};
