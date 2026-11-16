'use client';
import { ProjectSettings } from '@/app/(main)/[organizationId]/[projectId]/settings/ProjectSettings';
import { ProjectProvider } from '@/app/(main)/[organizationId]/ProjectProvider';
import { Panel } from '@/components/common/Panel';

export function AdminProjectPage({ projectId }: { projectId: string }) {
  return (
    <ProjectProvider projectId={projectId}>
      <Panel>
        <ProjectSettings projectId={projectId} />
      </Panel>
    </ProjectProvider>
  );
}
