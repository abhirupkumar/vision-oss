import { TypeConfirmationForm } from '@/components/common/TypeConfirmationForm';
import { useDeleteQuery, useMessages } from '@/components/hooks';

const CONFIRM_VALUE = 'DELETE';

export function OrganizationDeleteForm({
  organizationId,
  onSave,
  onClose,
}: {
  organizationId: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { labels, formatMessage, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending, touch } = useDeleteQuery(
    `/organizations/${organizationId}`,
  );

  const handleConfirm = async () => {
    await mutateAsync(null, {
      onSuccess: async () => {
        touch('organizations');
        touch(`organizations:${organizationId}`);
        onSave?.();
        onClose?.();
      },
    });
  };

  return (
    <TypeConfirmationForm
      confirmationValue={CONFIRM_VALUE}
      onConfirm={handleConfirm}
      onClose={onClose}
      isLoading={isPending}
      error={getErrorMessage(error)}
      buttonLabel={formatMessage(labels.delete)}
      buttonVariant="danger"
    />
  );
}
