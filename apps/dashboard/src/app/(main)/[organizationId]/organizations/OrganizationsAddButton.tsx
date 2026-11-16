import { Button, Icon, Text, useToast } from '@umami/react-zen';
import { useState } from 'react';
import { useMessages, useModified } from '@/components/hooks';
import { Plus } from '@/components/icons';
import { messages } from '@/components/messages';
import { OrganizationAddForm } from './OrganizationAddForm';

export function OrganizationsAddButton({ onSave }: { onSave?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { formatMessage, labels } = useMessages();
  const { toast } = useToast();
  const { touch } = useModified();

  const handleSave = async () => {
    toast(formatMessage(messages.saved));
    touch('organizations');
    setIsOpen(false);
    onSave?.();
  };

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        <Icon>
          <Plus />
        </Icon>
        <Text>{formatMessage(labels.createOrganization)}</Text>
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <OrganizationAddForm onSave={handleSave} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
