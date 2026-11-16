import { DataGrid } from '@/components/common/DataGrid';
import { useProjectCohortsQuery } from '@/components/hooks';
import { CohortAddButton } from './CohortAddButton';
import { CohortsTable } from './CohortsTable';

export function CohortsDataTable({ projectId }: { projectId?: string }) {
  const query = useProjectCohortsQuery(projectId, { type: 'cohort' });

  const renderActions = () => {
    return <CohortAddButton projectId={projectId} />;
  };

  return (
    <DataGrid
      query={query}
      allowSearch={true}
      autoFocus={false}
      allowPaging={true}
      renderActions={renderActions}
    >
      {({ data }) => <CohortsTable data={data} />}
    </DataGrid>
  );
}
