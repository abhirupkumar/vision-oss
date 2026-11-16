import { DataGrid } from '@/components/common/DataGrid';
import { useOrganizationMembersQuery } from '@/components/hooks';
import { OrganizationMembersTable } from './OrganizationMembersTable';

export function OrganizationMembersDataTable({
  organizationId,
  allowEdit = false,
}: {
  organizationId: string;
  allowEdit?: boolean;
}) {
  const queryResult = useOrganizationMembersQuery(organizationId);

  return (
    <DataGrid query={queryResult} allowSearch>
      {({ data }) => (
        <OrganizationMembersTable
          data={data}
          organizationId={organizationId}
          allowEdit={allowEdit}
        />
      )}
    </DataGrid>
  );
}
