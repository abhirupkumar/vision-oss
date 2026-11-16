import { CohortEditForm } from '@/app/(main)/[organizationId]/[projectId]/cohorts/CohortEditForm';
import { useMessages } from '@/components/hooks';
import { Edit } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import type { Filter } from '@/lib/types';

export function CohortEditButton({
  cohortId,
  projectId,
  filters,
}: {
  cohortId: string;
  projectId: string;
  filters?: Filter[];
}) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Edit />}
      variant="ghost"
      title={formatMessage(labels.cohort)}
      width="800px"
    >
      {({ close }) => {
        return (
          <CohortEditForm
            cohortId={cohortId}
            projectId={projectId}
            filters={filters}
            onClose={close}
          />
        );
      }}
    </DialogButton>
  );
}
