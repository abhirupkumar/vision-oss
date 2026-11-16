import type { Metadata } from 'next';
import { SegmentsPage } from './SegmentsPage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <SegmentsPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Segments',
};
