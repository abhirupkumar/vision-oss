'use client';
import { X } from 'lucide-react';
import { useDeleteQuery, useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';

export function OrganizationProjectRemoveButton({ organizationId, projectId, onSave }) {
  const { formatMessage, labels } = useMessages();
  const { mutateAsync, isPending } = useDeleteQuery(
    `/organizations/${organizationId}/projects/${projectId}`,
  );

  const handleRemove = async () => {
    await mutateAsync(null, {
      onSuccess: () => {
        onSave?.();
      },
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={isPending}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <X className="mr-2 h-4 w-4" />
      {formatMessage(labels.remove)}
    </Button>
  );
}
