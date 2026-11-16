import type { Metadata } from 'next';
import { SessionsPage } from './SessionsPage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <SessionsPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Sessions',
};
