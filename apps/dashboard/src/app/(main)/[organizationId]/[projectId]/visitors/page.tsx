import type { Metadata } from 'next';
import { VisitorsPage } from './VisitorsPage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <VisitorsPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Visitors',
};
