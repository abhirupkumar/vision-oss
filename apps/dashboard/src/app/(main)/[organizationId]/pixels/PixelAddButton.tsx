import { useMessages } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { PixelEditForm } from './PixelEditForm';

export function PixelAddButton({ organizationId }: { organizationId?: string }) {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton
      icon={<Plus />}
      label={formatMessage(labels.addPixel)}
      variant="primary"
      width="600px"
    >
      {({ close }) => <PixelEditForm organizationId={organizationId} onClose={close} />}
    </DialogButton>
  );
}
