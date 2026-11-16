'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMessages } from '@/components/hooks';
import { LockKeyhole } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PasswordEditForm } from './PasswordEditForm';

export function PasswordChangeButton() {
  const { formatMessage, labels, messages } = useMessages();
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    toast.success(formatMessage(messages.saved));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LockKeyhole className="mr-2 h-4 w-4" />
          {formatMessage(labels.changePassword)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{formatMessage(labels.changePassword)}</DialogTitle>
        </DialogHeader>
        <PasswordEditForm onSave={handleSave} onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
