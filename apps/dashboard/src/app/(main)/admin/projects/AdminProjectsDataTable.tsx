import { DataGrid } from '@/components/common/DataGrid';
import { useProjectsQuery } from '@/components/hooks';
import { AdminProjectsTable } from './AdminProjectsTable';

export function AdminProjectsDataTable() {
  const query = useProjectsQuery();

  return (
    <DataGrid query={query} allowSearch={true}>
      {props => <AdminProjectsTable {...props} />}
    </DataGrid>
  );
}
