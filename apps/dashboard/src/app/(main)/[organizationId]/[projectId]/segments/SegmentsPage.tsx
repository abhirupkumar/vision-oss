'use client';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { SegmentsDataTable } from './SegmentsDataTable';

export function SegmentsPage({ projectId }) {
  return (
    <div className="flex flex-col gap-3">
      <ProjectControls projectId={projectId} allowFilter={false} allowDateFilter={false} />
      <Panel>
        <SegmentsDataTable projectId={projectId} />
      </Panel>
    </div>
  );
}
