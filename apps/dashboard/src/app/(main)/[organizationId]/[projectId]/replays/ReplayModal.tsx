'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReplayPlayback } from './ReplayPlayback';

export function ReplayModal({
  projectId,
  sessionId,
  open,
  onClose,
}: {
  projectId: string;
  sessionId: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        style={{ maxWidth: 'min(90vw, 900px)', width: '90vw' }}
      >
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold">Session Replay</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <ReplayPlayback projectId={projectId} sessionId={sessionId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
