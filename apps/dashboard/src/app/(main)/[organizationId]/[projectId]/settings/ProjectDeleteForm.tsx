import { TypeConfirmationForm } from '@/components/common/TypeConfirmationForm';
import { useDeleteQuery, useMessages, useNavigation } from '@/components/hooks';

export function ProjectDeleteForm({
  projectId,
  projectName,
  onSave,
  onClose,
}: {
  projectId: string;
  projectName?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels } = useMessages();
  const { organizationId, pathname, router } = useNavigation();
  const { mutateAsync, isPending, error, touch } = useDeleteQuery(`/projects/${projectId}`);

  const confirmationValue = projectName || 'DELETE';

  const handleConfirm = async () => {
    await mutateAsync(null, {
      onSuccess: async () => {
        touch('projects');
        touch(`projects:${projectId}`);
        onSave?.();
        onClose?.();
        if (organizationId && !pathname.startsWith('/admin')) {
          router.push(`/${organizationId}`);
        }
      },
    });
  };

  return (
    <TypeConfirmationForm
      confirmationValue={confirmationValue}
      onConfirm={handleConfirm}
      onClose={onClose}
      isLoading={isPending}
      error={error}
      buttonLabel={formatMessage(labels.delete)}
      buttonVariant="danger"
    />
  );
}
