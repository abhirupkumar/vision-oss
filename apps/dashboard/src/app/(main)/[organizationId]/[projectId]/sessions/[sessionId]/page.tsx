import type { Metadata } from 'next';
import { SessionProfilePage } from './SessionProfilePage';

export default async function ({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
}) {
  const { projectId, sessionId } = await params;

  return <SessionProfilePage projectId={projectId} sessionId={sessionId} />;
}

export const metadata: Metadata = {
  title: 'Session Profile',
};
