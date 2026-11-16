'use client';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useProject } from '@/components/hooks';
import { ProjectData } from './ProjectData';
import { ProjectEditForm } from './ProjectEditForm';
import { ProjectShareForm } from './ProjectShareForm';
import { ProjectTrackingCode } from './ProjectTrackingCode';
import { ProjectLlmProxy } from './ProjectLlmProxy';
import { ProjectPaymentSettings } from './ProjectPaymentSettings';
import { ProjectDangerZone } from './ProjectDangerZone';
import { ThemeSetting } from '@/app/(main)/[organizationId]/settings/preferences/ThemeSetting';

export function ProjectSettings({ projectId }: { projectId: string; openExternal?: boolean }) {
  const project = useProject();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" icon={<Settings size={20} />} />
      <Panel title="Appearance">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Choose your preferred color theme for the dashboard interface.
          </p>
          <ThemeSetting />
        </div>
      </Panel>
      <Panel>
        <ProjectEditForm projectId={projectId} />
      </Panel>
      <Panel>
        <ProjectTrackingCode projectId={projectId} />
      </Panel>
      <Panel>
        <ProjectPaymentSettings projectId={projectId} />
      </Panel>
      <Panel>
        <ProjectLlmProxy projectId={projectId} />
      </Panel>
      <Panel>
        <ProjectShareForm projectId={projectId} shareId={project.shareId} />
      </Panel>
      <Panel>
        <ProjectData projectId={projectId} />
      </Panel>
      <Panel title="Danger Zone" className="border-destructive/30 bg-destructive/5">
        <ProjectDangerZone projectId={projectId} projectName={project?.name} />
      </Panel>
    </div>
  );
}
