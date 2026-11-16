'use client';
import { Column } from '@umami/react-zen';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { Users } from '@/components/icons';
import { OrganizationsDataTable } from './OrganizationsDataTable';

export default function OrganizationsPage() {
  const { formatMessage, labels } = useMessages();

  return (
    <div className="p-6">
      <Column gap="6">
        <PageHeader title={formatMessage(labels.organizations)} icon={<Users />} />
        <Panel>
          <OrganizationsDataTable />
        </Panel>
      </Column>
    </div>
  );
}
