import { ProjectExpandedMenu } from '@/app/(main)/[organizationId]/[projectId]/ProjectExpandedMenu';
import { useMessages, useNavigation } from '@/components/hooks';
import { MobileMenuButton } from '@/components/input/MobileMenuButton';
import { MetricsExpandedTable } from '@/components/metrics/MetricsExpandedTable';

export function ProjectExpandedView({
  projectId,
  excludedIds = [],
  onClose,
}: {
  projectId: string;
  excludedIds?: string[];
  onClose?: () => void;
}) {
  const { formatMessage, labels } = useMessages();
  const {
    query: { view },
  } = useNavigation();

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div id="expanded-mobile-menu-button" className="flex md:hidden">
        <MobileMenuButton>
          {({ close }) => {
            return (
              <div className="flex flex-col p-3">
                <ProjectExpandedMenu excludedIds={excludedIds} onItemClick={close} />
              </div>
            );
          }}
        </MobileMenuButton>
      </div>
      <div className="grid h-full overflow-hidden gap-6 md:grid-cols-[240px_1fr]">
        <div
          id="metrics-expanded-menu"
          className="hidden md:flex flex-col gap-6 border-r border-border pr-3 overflow-auto"
        >
          <ProjectExpandedMenu excludedIds={excludedIds} />
        </div>
        <div id="metrics-expanded-table" className="flex flex-col overflow-hidden">
          <MetricsExpandedTable
            title={formatMessage(labels[view])}
            type={view}
            projectId={projectId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
