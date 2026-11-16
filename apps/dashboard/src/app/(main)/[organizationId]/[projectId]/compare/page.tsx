import type { Metadata } from 'next';
import { ComparePage } from './ComparePage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <ComparePage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Compare',
};
