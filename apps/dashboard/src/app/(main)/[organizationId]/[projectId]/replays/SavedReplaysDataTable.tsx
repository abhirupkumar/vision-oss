import { DataGrid } from '@/components/common/DataGrid';
import { useSavedReplaysQuery } from '@/components/hooks/queries/useSavedReplaysQuery';

export function SavedReplaysDataTable({
  projectId,
  children,
}: {
  projectId: string;
  children: (props: { data: any[] }) => React.ReactNode;
}) {
  const queryResult = useSavedReplaysQuery(projectId);

  return (
    <DataGrid query={queryResult} allowSearch allowPaging>
      {children}
    </DataGrid>
  );
}
