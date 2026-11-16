'use client';

import { useState } from 'react';
import { ReplaysDataTable } from './ReplaysDataTable';
import { ReplaysTable } from './ReplaysTable';
import { SavedReplaysDataTable } from './SavedReplaysDataTable';
import { SavedReplaysTable } from './SavedReplaysTable';
import { ReplayModal } from './ReplayModal';

export function ReplaysPage({ projectId }: { projectId: string }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Session Replays</h2>
        <ReplaysDataTable projectId={projectId}>
          {({ data }) => (
            <ReplaysTable data={data} onSelect={setSelectedSessionId} />
          )}
        </ReplaysDataTable>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Saved Replays</h2>
        <SavedReplaysDataTable projectId={projectId}>
          {({ data }) => <SavedReplaysTable data={data} />}
        </SavedReplaysDataTable>
      </div>

      {selectedSessionId && (
        <ReplayModal
          projectId={projectId}
          sessionId={selectedSessionId}
          open={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
