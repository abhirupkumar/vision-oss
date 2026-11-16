import { DataGrid } from '@/components/common/DataGrid';
import { useProjectSessionsQuery } from '@/components/hooks';
import { SessionsTable } from './SessionsTable';

export function SessionsDataTable({
  projectId,
  visitorId,
  startAt,
  endAt,
}: {
  projectId?: string;
  visitorId?: string;
  startAt?: number;
  endAt?: number;
}) {
  const params: any = { visitorId };
  if (startAt !== undefined) params.startAt = startAt;
  if (endAt !== undefined) params.endAt = endAt;

  const queryResult = useProjectSessionsQuery(projectId, params);

  return (
    <DataGrid query={queryResult} allowPaging allowSearch>
      {({ data }) => {
        return <SessionsTable data={data} projectId={projectId} />;
      }}
    </DataGrid>
  );
}
