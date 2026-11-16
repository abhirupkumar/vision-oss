import { TypeConfirmationForm } from '@/components/common/TypeConfirmationForm';
import { useMessages, useUpdateQuery } from '@/components/hooks';

const CONFIRM_VALUE = 'RESET';

export function ProjectResetForm({
  projectId,
  onSave,
  onClose,
}: {
  projectId: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels } = useMessages();
  const { mutateAsync, isPending, error } = useUpdateQuery(`/projects/${projectId}/reset`);

  const handleConfirm = async () => {
    await mutateAsync(null, {
      onSuccess: async () => {
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
      error={error}
      buttonLabel={formatMessage(labels.reset)}
    />
  );
}
