import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { SegmentEditForm } from './SegmentEditForm';

export function SegmentAddButton({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Plus />}
      label={formatMessage(labels.segment)}
      variant="primary"
      width="800px"
    >
      {({ close }) => {
        return <SegmentEditForm projectId={projectId} onClose={close} />;
      }}
    </DialogButton>
  );
}
