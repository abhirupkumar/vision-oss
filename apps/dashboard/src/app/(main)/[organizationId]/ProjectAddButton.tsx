'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateProjectModal } from '@/components/common/CreateProjectModal';
import { useModified, useOrganizationQuery } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ProjectAddButton({
  organizationId,
  onSave,
}: {
  organizationId: string;
  onSave?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { touch } = useModified();

  // Fetch org name so the selector shows it immediately when the modal opens
  const { data: orgData } = useOrganizationQuery(organizationId);
  const orgName: string = orgData?.name ?? orgData?.data?.name ?? '';

  const handleSuccess = (orgId: string, projectId: string) => {
    toast('Project created successfully!');
    touch('projects');
    onSave?.();
    setOpen(false);
    window.location.href = `/${orgId}/${projectId}`;
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Plus size={15} />
        Add Project
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg w-full">
          <CreateProjectModal
            mode="project"
            defaultOrganizationId={organizationId}
            defaultOrganizationName={orgName}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
            isCancellable
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
