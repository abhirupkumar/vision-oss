'use client';

import { useState } from 'react';
import { ActionForm } from '@/components/common/ActionForm';
import {
  useMessages,
  useModified,
  useNavigation,
  useProject,
} from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProjectResetForm } from './ProjectResetForm';
import { ProjectTransferForm } from './ProjectTransferForm';

export function ProjectData({ projectId, onSave }: { projectId: string; onSave?: () => void }) {
  const { formatMessage, labels, messages } = useMessages();
  const project = useProject();
  const { touch } = useModified();
  const { router, pathname, renderUrl } = useNavigation();
  const [transferOpen, setTransferOpen] = useState(false);
  const isAdmin = pathname.startsWith('/admin');

  const handleSave = () => {
    touch('projects');
    onSave?.();
    router.push(renderUrl(''));
  };

  const handleReset = async () => {
    onSave?.();
  };

  return (
    <div className="flex flex-col gap-6">
      {!isAdmin && (
        <ActionForm
          label={formatMessage(labels.transferProject)}
          description={formatMessage(messages.transferProject)}
        >
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                {formatMessage(labels.transfer)}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>{formatMessage(labels.transferProject)}</DialogTitle>
              </DialogHeader>
              <ProjectTransferForm
                projectId={projectId}
                projectName={project?.name || ''}
                onSave={handleSave}
                onClose={() => setTransferOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </ActionForm>
      )}

      <ActionForm
        label={formatMessage(labels.resetProject)}
        description={formatMessage(messages.resetProjectWarning)}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{formatMessage(labels.reset)}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{formatMessage(labels.resetProject)}</DialogTitle>
            </DialogHeader>
            <ProjectResetForm projectId={projectId} onSave={handleReset} />
          </DialogContent>
        </Dialog>
      </ActionForm>
    </div>
  );
}
