'use client';
import { ExportButton } from '@/components/input/ExportButton';
import { FilterBar } from '@/components/input/FilterBar';
import { MonthFilter } from '@/components/input/MonthFilter';
import { ProjectDateFilter } from '@/components/input/ProjectDateFilter';
import { ProjectFilterButton } from '@/components/input/ProjectFilterButton';

export function ProjectControls({
  projectId,
  allowFilter = true,
  allowDateFilter = true,
  allowMonthFilter,
  allowDownload = false,
  allowCompare = false,
}: {
  projectId: string;
  allowFilter?: boolean;
  allowDateFilter?: boolean;
  allowMonthFilter?: boolean;
  allowDownload?: boolean;
  allowCompare?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-start">
          {allowFilter ? <ProjectFilterButton projectId={projectId} /> : <div />}
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
          {allowDateFilter && (
            <ProjectDateFilter projectId={projectId} allowCompare={allowCompare} />
          )}
          {allowDownload && <ExportButton projectId={projectId} />}
          {allowMonthFilter && <MonthFilter />}
        </div>
      </div>
      {allowFilter && <FilterBar projectId={projectId} />}
    </div>
  );
}
