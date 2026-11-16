import { useMessages } from '@/components/hooks';
import { Edit } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import type { Filter } from '@/lib/types';
import { SegmentEditForm } from './SegmentEditForm';

export function SegmentEditButton({
  segmentId,
  projectId,
  filters,
}: {
  segmentId: string;
  projectId: string;
  filters?: Filter[];
}) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Edit />}
      title={formatMessage(labels.segment)}
      variant="ghost"
      width="800px"
    >
      {({ close }) => {
        return (
          <SegmentEditForm
            segmentId={segmentId}
            projectId={projectId}
            filters={filters}
            onClose={close}
          />
        );
      }}
    </DialogButton>
  );
}
