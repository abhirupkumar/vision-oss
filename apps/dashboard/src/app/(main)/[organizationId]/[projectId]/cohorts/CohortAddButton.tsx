import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { CohortEditForm } from './CohortEditForm';

export function CohortAddButton({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Plus />}
      label={formatMessage(labels.cohort)}
      variant="primary"
      width="800px"
    >
      {({ close }) => {
        return <CohortEditForm projectId={projectId} onClose={close} />;
      }}
    </DialogButton>
  );
}
