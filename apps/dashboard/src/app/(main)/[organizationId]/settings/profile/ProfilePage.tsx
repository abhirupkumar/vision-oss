'use client';

import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { ProfileSettings } from './ProfileSettings';

export function ProfilePage() {
  const { formatMessage, labels } = useMessages();

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <PageHeader title={formatMessage(labels.profile)} />
        <Panel>
          <ProfileSettings />
        </Panel>
      </div>
    </PageBody>
  );
}
