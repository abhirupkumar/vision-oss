'use client';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useMessages, useModified } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrganizationMemberEditForm } from './OrganizationMemberEditForm';

export function OrganizationMemberEditButton({
  organizationId,
  userId,
  role,
  onSave,
}: {
  organizationId: string;
  userId: string;
  role: string;
  onSave?: () => void;
}) {
  const { formatMessage, labels, messages } = useMessages();
  const { touch } = useModified();

  const handleSave = () => {
    touch('organizations:members');
    toast(formatMessage(messages.saved));
    onSave?.();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{formatMessage(labels.editMember)}</DialogTitle>
        </DialogHeader>
        <OrganizationMemberEditForm
          organizationId={organizationId}
          userId={userId}
          role={role}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
}
