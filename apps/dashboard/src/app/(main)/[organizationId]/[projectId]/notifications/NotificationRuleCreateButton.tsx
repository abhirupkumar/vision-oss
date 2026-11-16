'use client';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NotificationRuleCreateForm } from './NotificationRuleCreateForm';

export function NotificationRuleCreateButton({
  projectId,
  onSave,
}: {
  projectId: string;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          Add Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Notification Rule</DialogTitle>
        </DialogHeader>
        <NotificationRuleCreateForm
          projectId={projectId}
          onSave={() => {
            onSave();
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
