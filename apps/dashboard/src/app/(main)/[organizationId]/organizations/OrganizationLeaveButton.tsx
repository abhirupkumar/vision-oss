'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useLoginQuery, useMessages, useModified } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrganizationLeaveForm } from './OrganizationLeaveForm';

export function OrganizationLeaveButton({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const { formatMessage, labels } = useMessages();
  const router = useRouter();
  const { user } = useLoginQuery();
  const { touch } = useModified();
  const [open, setOpen] = useState(false);

  const handleLeave = async () => {
    touch('organizations');
    setOpen(false);
    router.push('/organizations');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogOut className="h-4 w-4" />
          <span>{formatMessage(labels.leave)}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{formatMessage(labels.leaveOrganization)}</DialogTitle>
        </DialogHeader>
        <OrganizationLeaveForm
          organizationId={organizationId}
          userId={user?.id}
          organizationName={organizationName}
          onSave={handleLeave}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
