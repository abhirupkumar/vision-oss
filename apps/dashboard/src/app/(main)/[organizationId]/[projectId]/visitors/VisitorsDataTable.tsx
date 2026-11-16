'use client';
import { useMemo } from 'react';
import { DataGrid } from '@/components/common/DataGrid';
import { useProjectVisitorsQuery } from '@/components/hooks';
import { VisitorsTable } from './VisitorsTable';

const isIdentifiedRow = (row: any) =>
  !!((row.distinctId && row.distinctId !== row.id) || row.email || row.firstName || row.lastName);

export function VisitorsDataTable({
  projectId,
  identified,
}: {
  projectId?: string;
  identified?: boolean;
}) {
  const queryResult = useProjectVisitorsQuery(
    projectId,
    identified !== undefined ? { identified: String(identified) } : undefined,
  );

  // Post-process the query result so that:
  //  - `data.data`  only contains rows that match the identified filter
  //  - `data.count` reflects the filtered count (accurate in Postgres mode where the server
  //    already filters; in ClickHouse mode where the server can't filter, we at least show the
  //    right per-page count so the pager doesn't show phantom extra pages).
  const filteredQueryResult = useMemo(() => {
    if (!queryResult.data || identified === undefined) return queryResult;

    const rows: any[] = queryResult.data.data ?? [];
    const filteredRows =
      identified === true
        ? rows.filter(isIdentifiedRow)
        : rows.filter(row => !isIdentifiedRow(row));

    // If the server already filtered correctly (Postgres mode), every returned row already
    // matches so filteredRows.length === rows.length. In that case keep server's total count
    // (which correctly spans all pages).
    // If some rows were stripped client-side (ClickHouse mode), use filteredRows.length so
    // the pager doesn't mislead the user with a count that includes the wrong-tab visitors.
    const serverFiltered = filteredRows.length === rows.length;
    const count = serverFiltered ? queryResult.data.count : filteredRows.length;

    return {
      ...queryResult,
      data: {
        ...queryResult.data,
        data: filteredRows,
        count,
      },
    };
  }, [queryResult, identified]);

  return (
    <DataGrid query={filteredQueryResult as any} allowPaging allowSearch>
      {({ data }) => {
        return <VisitorsTable data={data} identified={identified} />;
      }}
    </DataGrid>
  );
}
