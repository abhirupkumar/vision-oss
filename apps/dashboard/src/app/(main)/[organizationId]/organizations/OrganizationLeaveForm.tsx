import { ConfirmationForm } from '@/components/common/ConfirmationForm';
import { useDeleteQuery, useMessages, useModified } from '@/components/hooks';

export function OrganizationLeaveForm({
  organizationId,
  userId,
  organizationName,
  onSave,
  onClose,
}: {
  organizationId: string;
  userId: string;
  organizationName: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage, FormattedMessage } = useMessages();
  const { mutateAsync, error, isPending } = useDeleteQuery(
    `/organizations/${organizationId}/users/${userId}`,
  );
  const { touch } = useModified();

  const handleConfirm = async () => {
    await mutateAsync(null, {
      onSuccess: async () => {
        touch('organizations:members');
        onSave();
        onClose();
      },
    });
  };

  return (
    <ConfirmationForm
      buttonLabel={formatMessage(labels.leave)}
      message={
        <FormattedMessage
          {...messages.confirmLeave}
          values={{
            target: <b>{organizationName}</b>,
          }}
        />
      }
      onConfirm={handleConfirm}
      onClose={onClose}
      isLoading={isPending}
      error={getErrorMessage(error)}
    />
  );
}
