'use client';
import { ExpandedViewModal } from '@/app/(main)/[organizationId]/[projectId]/ExpandedViewModal';
import { ProjectChart } from '@/app/(main)/[organizationId]/[projectId]/ProjectChart';
import { LinkControls } from '@/app/(main)/[organizationId]/links/[linkId]/LinkControls';
import { LinkHeader } from '@/app/(main)/[organizationId]/links/[linkId]/LinkHeader';
import { LinkMetricsBar } from '@/app/(main)/[organizationId]/links/[linkId]/LinkMetricsBar';
import { LinkPanels } from '@/app/(main)/[organizationId]/links/[linkId]/LinkPanels';
import { LinkProvider } from '@/app/(main)/[organizationId]/links/LinkProvider';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';

const excludedIds = ['path', 'entry', 'exit', 'title', 'language', 'screen', 'event'];

export function LinkPage({ linkId }: { linkId: string }) {
  return (
    <LinkProvider linkId={linkId}>
      <div className="w-full h-full">
        <div className="m-2">
          <PageBody>
            <LinkHeader />
            <LinkControls linkId={linkId} />
            <LinkMetricsBar linkId={linkId} showChange={true} />
            <Panel>
              <ProjectChart projectId={linkId} />
            </Panel>
            <LinkPanels linkId={linkId} />
          </PageBody>
          <ExpandedViewModal projectId={linkId} excludedIds={excludedIds} />
        </div>
      </div>
    </LinkProvider>
  );
}
