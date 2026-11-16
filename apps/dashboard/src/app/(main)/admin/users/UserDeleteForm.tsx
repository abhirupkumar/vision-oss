'use client';
import { useDeleteQuery, useMessages, useModified } from '@/components/hooks';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function UserDeleteForm({
  userId,
  email,
  onSave,
  onClose,
}: {
  userId: string;
  email: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { messages, labels, formatMessage, FormattedMessage } = useMessages();
  const { mutateAsync, isPending } = useDeleteQuery(`/users/${userId}`);
  const { touch } = useModified();

  const handleConfirm = async () => {
    await mutateAsync(null, {
      onSuccess: async () => {
        touch('users');
        touch(`users:${userId}`);
        onSave?.();
        onClose?.();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <FormattedMessage
          {...messages.confirmDelete}
          values={{ target: <span className="font-bold text-foreground">{email}</span> }}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {formatMessage(labels.cancel)}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {formatMessage(labels.delete)}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </div>
  );
}
