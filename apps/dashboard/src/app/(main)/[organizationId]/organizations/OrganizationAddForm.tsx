'use client';

import { CreateWorkspaceModal } from '@/components/common/CreateWorkspaceModal';

export function OrganizationAddForm({
  onSave,
  onClose,
}: {
  onSave: () => void;
  onClose: () => void;
}) {
  return <CreateWorkspaceModal onSuccess={onSave} onCancel={onClose} isCancellable={true} />;
}
