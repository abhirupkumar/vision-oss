import { DataGrid } from '@/components/common/DataGrid';
import { useReplaysQuery } from '@/components/hooks/queries/useReplaysQuery';

export function ReplaysDataTable({
  projectId,
  params,
  children,
}: {
  projectId: string;
  params?: Record<string, string | number>;
  children: (props: { data: any[] }) => React.ReactNode;
}) {
  const queryResult = useReplaysQuery(projectId, params);

  return (
    <DataGrid query={queryResult} allowSearch allowPaging>
      {children}
    </DataGrid>
  );
}
