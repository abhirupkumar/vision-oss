'use client';
import { X } from 'lucide-react';
import { useState } from 'react';
import { SegmentEditForm } from '@/app/(main)/[organizationId]/[projectId]/segments/SegmentEditForm';
import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { cn } from '@/lib/cn';

export function SegmentSaveButton({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium',
          'text-primary-foreground hover:bg-primary/90 transition-colors',
        )}
      >
        <span className="h-4 w-4">
          <Plus />
        </span>
        {formatMessage(labels.segment)}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-[800px] max-w-full rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{formatMessage(labels.segment)}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <X size={14} />
              </button>
            </div>
            <SegmentEditForm projectId={projectId} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
