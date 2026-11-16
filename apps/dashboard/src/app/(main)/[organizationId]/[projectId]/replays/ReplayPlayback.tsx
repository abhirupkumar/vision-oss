'use client';

import { useReplayChunksQuery } from '@/components/hooks/queries/useReplayChunksQuery';
import { ReplayPlayer } from './ReplayPlayer';

export function ReplayPlayback({ projectId, sessionId }: { projectId: string; sessionId: string }) {
  const query = useReplayChunksQuery(projectId, sessionId);

  if (query.isLoading) {
    return <div className="flex items-center justify-center p-8">Loading replay...</div>;
  }

  if (query.isError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">Error loading replay</div>
    );
  }

  return <ReplayPlayer chunks={query.data} />;
}
