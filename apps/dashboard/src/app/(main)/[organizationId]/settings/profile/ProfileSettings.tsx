'use client';

import { useConfig, useLoginQuery, useMessages } from '@/components/hooks';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/lib/constants';
import { PasswordChangeButton } from './PasswordChangeButton';

export function ProfileSettings() {
  const { user } = useLoginQuery();
  const { formatMessage, labels } = useMessages();
  const { cloudMode } = useConfig();

  if (!user) {
    return null;
  }

  const { email, role } = user;

  const renderRole = (value: string) => {
    if (value === ROLES.user) {
      return formatMessage(labels.user);
    }
    if (value === ROLES.admin) {
      return formatMessage(labels.admin);
    }
    if (value === ROLES.viewOnly) {
      return formatMessage(labels.viewOnly);
    }

    return formatMessage(labels.unknown);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[400px]">
      <div className="flex flex-col gap-2">
        <Label>{formatMessage(labels.email)}</Label>
        <span className="text-sm">{email}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Label>{formatMessage(labels.role)}</Label>
        <span className="text-sm">{renderRole(role)}</span>
      </div>
      {!cloudMode && (
        <div className="flex flex-col gap-2">
          <Label>{formatMessage(labels.password)}</Label>
          <div className="flex">
            <PasswordChangeButton />
          </div>
        </div>
      )}
    </div>
  );
}
