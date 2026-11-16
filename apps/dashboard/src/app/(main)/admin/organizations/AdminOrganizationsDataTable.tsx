import type { ReactNode } from 'react';
import { DataGrid } from '@/components/common/DataGrid';
import { useOrganizationsQuery } from '@/components/hooks';
import { AdminOrganizationsTable } from './AdminOrganizationsTable';

export function AdminOrganizationsDataTable({
  showActions,
}: {
  showActions?: boolean;
  children?: ReactNode;
}) {
  const queryResult = useOrganizationsQuery();

  return (
    <DataGrid query={queryResult} allowSearch={true}>
      {({ data }) => <AdminOrganizationsTable data={data} showActions={showActions} />}
    </DataGrid>
  );
}
