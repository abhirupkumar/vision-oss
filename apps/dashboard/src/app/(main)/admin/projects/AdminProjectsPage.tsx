'use client';
import { Column } from '@umami/react-zen';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { AdminProjectsDataTable } from './AdminProjectsDataTable';

export function AdminProjectsPage() {
  const { formatMessage, labels } = useMessages();

  return (
    <Column gap="6" margin="2">
      <PageHeader title={formatMessage(labels.projects)} />
      <Panel>
        <AdminProjectsDataTable />
      </Panel>
    </Column>
  );
}
