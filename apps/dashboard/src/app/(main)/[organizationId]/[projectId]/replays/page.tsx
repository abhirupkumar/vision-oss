import type { Metadata } from 'next';
import { ReplaysPage } from './ReplaysPage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <ReplaysPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Replays',
};
