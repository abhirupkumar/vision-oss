import type { Metadata } from 'next';
import { VisitorProfilePage } from './VisitorProfilePage';

export default async function ({
  params,
}: {
  params: Promise<{ projectId: string; visitorId: string }>;
}) {
  const { projectId, visitorId } = await params;

  return <VisitorProfilePage projectId={projectId} visitorId={visitorId} />;
}

export const metadata: Metadata = {
  title: 'Visitor Profile',
};
