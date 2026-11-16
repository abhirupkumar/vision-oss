import { Share2, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { ProjectShareForm } from '@/app/(main)/[organizationId]/[projectId]/settings/ProjectShareForm';
import { Favicon } from '@/components/common/Favicon';
import { useMessages, useNavigation, useProject } from '@/components/hooks';
import { DialogButton } from '@/components/input/DialogButton';
import { ActiveUsers } from '@/components/metrics/ActiveUsers';

export function ProjectHeader({ showActions }: { showActions?: boolean }) {
  const project = useProject();
  const { renderUrl, pathname } = useNavigation();
  const isSettings = pathname.endsWith('/settings');
  const { formatMessage, labels } = useMessages();

  if (isSettings) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border py-6 mb-6 md:flex-row md:items-center md:justify-between">
      {/* Title area */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
          <Favicon domain={project.domain} />
        </div>
        <Link
          href={renderUrl(`/${project.id}`, false)}
          className="text-xl font-semibold text-foreground hover:underline md:text-2xl"
        >
          {project.name}
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <ActiveUsers projectId={project.id} />

        {showActions && (
          <div className="flex items-center gap-2">
            <ShareButton projectId={project.id} shareId={project.shareId} />
            <Link
              href={renderUrl(`/${project.id}/settings`, false)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <SquarePen size={14} />
              <span>{formatMessage(labels.edit)}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const ShareButton = ({ projectId, shareId }: { projectId: string; shareId?: string }) => {
  const { formatMessage, labels } = useMessages();

  return (
    <DialogButton icon={<Share2 size={14} />} label={formatMessage(labels.share)} width="800px">
      {({ close }) => {
        return <ProjectShareForm projectId={projectId} shareId={shareId} onClose={close} />;
      }}
    </DialogButton>
  );
};
