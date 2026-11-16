import { ProjectsTable } from '@/app/(main)/[organizationId]/ProjectsTable';
import { DataGrid } from '@/components/common/DataGrid';
import { useUserProjectsQuery } from '@/components/hooks';

export function UserProjects({ userId }) {
  const queryResult = useUserProjectsQuery({ userId });

  return (
    <DataGrid query={queryResult}>
      {({ data }) => <ProjectsTable data={data} showActions={true} />}
    </DataGrid>
  );
}
