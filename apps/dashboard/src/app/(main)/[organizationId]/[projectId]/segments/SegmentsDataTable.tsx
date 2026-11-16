import { DataGrid } from '@/components/common/DataGrid';
import { useProjectSegmentsQuery } from '@/components/hooks';
import { SegmentAddButton } from './SegmentAddButton';
import { SegmentsTable } from './SegmentsTable';

export function SegmentsDataTable({ projectId }: { projectId?: string }) {
  const query = useProjectSegmentsQuery(projectId, { type: 'segment' });

  const renderActions = () => {
    return <SegmentAddButton projectId={projectId} />;
  };

  return (
    <DataGrid
      query={query}
      allowSearch={true}
      autoFocus={false}
      allowPaging={true}
      renderActions={renderActions}
    >
      {({ data }) => <SegmentsTable data={data} />}
    </DataGrid>
  );
}
