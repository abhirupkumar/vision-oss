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
import { ABTestCreateForm } from './ABTestCreateForm';

export function ABTestCreateButton({
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
          New Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
        </DialogHeader>
        <ABTestCreateForm
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
