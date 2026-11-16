'use client';

import { ProjectChart } from '@/app/(main)/[organizationId]/[projectId]/ProjectChart';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { ProjectMetricsBar } from '@/app/(main)/[organizationId]/[projectId]/ProjectMetricsBar';
import { Panel } from '@/components/common/Panel';
import { CompareTables } from './CompareTables';

export function ComparePage({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} allowCompare={true} />
      <ProjectMetricsBar projectId={projectId} showChange={true} />
      <Panel>
        <ProjectChart projectId={projectId} compareMode={true} />
      </Panel>
      <CompareTables projectId={projectId} />
    </div>
  );
}
