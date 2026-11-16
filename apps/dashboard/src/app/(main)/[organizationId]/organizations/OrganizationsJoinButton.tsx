import { Button, Dialog, DialogTrigger, Icon, Modal, Text, useToast } from '@umami/react-zen';
import { useMessages, useModified } from '@/components/hooks';
import { UserPlus } from '@/components/icons';
import { OrganizationJoinForm } from './OrganizationJoinForm';

export function OrganizationsJoinButton() {
  const { formatMessage, labels, messages } = useMessages();
  const { toast } = useToast();
  const { touch } = useModified();

  const handleJoin = () => {
    toast(formatMessage(messages.saved));
    touch('organizations');
  };

  return (
    <DialogTrigger>
      <Button>
        <Icon>
          <UserPlus />
        </Icon>
        <Text>{formatMessage(labels.joinOrganization)}</Text>
      </Button>
      <Modal>
        <Dialog title={formatMessage(labels.joinOrganization)} style={{ width: 400 }}>
          {({ close }) => <OrganizationJoinForm onSave={handleJoin} onClose={close} />}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
