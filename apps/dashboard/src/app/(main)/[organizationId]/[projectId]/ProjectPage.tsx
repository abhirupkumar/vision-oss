import { Suspense } from 'react';
import { ExpandedViewModal } from '@/app/(main)/[organizationId]/[projectId]/ExpandedViewModal';
import { Panel } from '@/components/common/Panel';
import { ProjectMetricsSkeleton } from '@/components/common/skeletons/ProjectMetricsSkeleton';
import { ProjectPanelsSkeleton } from '@/components/common/skeletons/ProjectPanelsSkeleton';
import { ProjectChart } from './ProjectChart';
import { ProjectControls } from './ProjectControls';
import { ProjectMetricsBar } from './ProjectMetricsBar';
import { ProjectPanels } from './ProjectPanels';
import { ProjectAiOverviewPanel } from './ProjectAiOverviewPanel';

export async function ProjectPage({
  projectId,
  searchParams,
}: {
  projectId: string;
  searchParams: Promise<any>;
}) {
  const sp = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} />
      <Suspense fallback={<ProjectMetricsSkeleton />}>
        <ProjectMetricsBar projectId={projectId} showChange={true} />
      </Suspense>
      <ProjectAiOverviewPanel projectId={projectId} />
      <Panel>
        <Suspense
          fallback={
            <div className="h-100 w-full animate-pulse rounded-lg border border-border bg-card p-6 shadow-sm" />
          }
        >
          <ProjectChart projectId={projectId} />
        </Suspense>
      </Panel>
      <Suspense fallback={<ProjectPanelsSkeleton />}>
        <ProjectPanels projectId={projectId} />
      </Suspense>
      <ExpandedViewModal projectId={projectId} />
    </div>
  );
}
