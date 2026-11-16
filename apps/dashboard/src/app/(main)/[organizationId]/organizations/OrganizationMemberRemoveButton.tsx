'use client';
import { Trash } from 'lucide-react';
import { ConfirmationForm } from '@/components/common/ConfirmationForm';
import { useDeleteQuery, useMessages, useModified } from '@/components/hooks';
import { messages } from '@/components/messages';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function OrganizationMemberRemoveButton({
  organizationId,
  userId,
  email,
  onSave,
}: {
  organizationId: string;
  userId: string;
  email: string;
  disabled?: boolean;
  onSave?: () => void;
}) {
  const { formatMessage, labels, FormattedMessage } = useMessages();
  const { mutateAsync, isPending, error } = useDeleteQuery(
    `/organizations/${organizationId}/users/${userId}`,
  );
  const { touch } = useModified();

  const handleConfirm = async () => {
    await mutateAsync(null, {
      onSuccess: () => {
        touch('organizations:members');
        onSave?.();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{formatMessage(labels.confirm)}</DialogTitle>
        </DialogHeader>
        <ConfirmationForm
          message={
            <FormattedMessage
              {...messages.confirmRemove}
              values={{
                target: <b className="text-foreground">{email}</b>,
              }}
            />
          }
          isLoading={isPending}
          error={error}
          onConfirm={handleConfirm}
          onClose={() => {}} // Dialog will close on click outside or trigger
          buttonLabel={formatMessage(labels.remove)}
          buttonVariant="danger"
        />
      </DialogContent>
    </Dialog>
  );
}
