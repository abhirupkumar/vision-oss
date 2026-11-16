import { Column, Row } from '@umami/react-zen';
import { ExportButton } from '@/components/input/ExportButton';
import { FilterBar } from '@/components/input/FilterBar';
import { MonthFilter } from '@/components/input/MonthFilter';
import { ProjectDateFilter } from '@/components/input/ProjectDateFilter';
import { ProjectFilterButton } from '@/components/input/ProjectFilterButton';

export function LinkControls({
  linkId: projectId,
  allowFilter = true,
  allowDateFilter = true,
  allowMonthFilter,
  allowDownload = false,
}: {
  linkId: string;
  allowFilter?: boolean;
  allowDateFilter?: boolean;
  allowMonthFilter?: boolean;
  allowDownload?: boolean;
}) {
  return (
    <Column gap>
      <Row alignItems="center" justifyContent="space-between" gap="3">
        {allowFilter ? <ProjectFilterButton projectId={projectId} /> : <div />}
        {allowDateFilter && <ProjectDateFilter projectId={projectId} showAllTime={false} />}
        {allowDownload && <ExportButton projectId={projectId} />}
        {allowMonthFilter && <MonthFilter />}
      </Row>
      {allowFilter && <FilterBar projectId={projectId} />}
    </Column>
  );
}
