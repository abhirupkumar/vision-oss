import { DataGrid } from '@/components/common/DataGrid';
import { useOrganizationProjectsQuery } from '@/components/hooks';
import { OrganizationProjectsTable } from './OrganizationProjectsTable';

export function OrganizationProjectsDataTable({
  organizationId,
  allowEdit = false,
}: {
  organizationId: string;
  allowEdit?: boolean;
}) {
  const queryResult = useOrganizationProjectsQuery(organizationId);

  return (
    <DataGrid query={queryResult} allowSearch>
      {({ data }) => (
        <OrganizationProjectsTable
          data={data}
          organizationId={organizationId}
          allowEdit={allowEdit}
        />
      )}
    </DataGrid>
  );
}
