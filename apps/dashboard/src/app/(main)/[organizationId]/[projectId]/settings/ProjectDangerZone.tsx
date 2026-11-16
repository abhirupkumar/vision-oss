'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProjectDeleteForm } from './ProjectDeleteForm';

export function ProjectDangerZone({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-destructive">Delete Project</h3>
          <p className="text-sm text-muted-foreground">
            Permanently remove this project and all of its associated data including events, revenue, and LLM metrics. This action cannot be undone.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="shrink-0">
              Delete Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Project</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the project{' '}
                <strong className="text-foreground">{projectName}</strong> and all associated data.
              </DialogDescription>
            </DialogHeader>
            <ProjectDeleteForm
              projectId={projectId}
              projectName={projectName}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
