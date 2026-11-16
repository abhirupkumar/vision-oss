'use client';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { ABTestsDataTable } from './ABTestsDataTable';

export function ABTestsPage({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col gap-3">
      <ProjectControls projectId={projectId} allowFilter={false} allowDateFilter={false} />
      <Panel>
        <ABTestsDataTable projectId={projectId} />
      </Panel>
    </div>
  );
}
