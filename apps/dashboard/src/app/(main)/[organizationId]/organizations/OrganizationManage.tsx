'use client';
import { useRouter } from 'next/navigation';
import { ActionForm } from '@/components/common/ActionForm';
import { useMessages, useModified } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrganizationDeleteForm } from './OrganizationDeleteForm';

export function OrganizationManage({ organizationId }: { organizationId: string }) {
  const { formatMessage, labels, messages } = useMessages();
  const router = useRouter();
  const { touch } = useModified();

  const handleLeave = async () => {
    touch('organizations');
    router.push('/organizations');
  };

  return (
    <ActionForm
      label={formatMessage(labels.deleteOrganization)}
      description={formatMessage(messages.deleteOrganizationWarning)}
    >
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">{formatMessage(labels.delete)}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{formatMessage(labels.deleteOrganization)}</DialogTitle>
          </DialogHeader>
          <OrganizationDeleteForm organizationId={organizationId} onSave={handleLeave} />
        </DialogContent>
      </Dialog>
    </ActionForm>
  );
}
