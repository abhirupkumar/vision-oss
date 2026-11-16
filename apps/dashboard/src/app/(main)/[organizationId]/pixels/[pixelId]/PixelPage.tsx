'use client';
import { Column, Grid } from '@umami/react-zen';
import { ExpandedViewModal } from '@/app/(main)/[organizationId]/[projectId]/ExpandedViewModal';
import { ProjectChart } from '@/app/(main)/[organizationId]/[projectId]/ProjectChart';
import { PixelControls } from '@/app/(main)/[organizationId]/pixels/[pixelId]/PixelControls';
import { PixelHeader } from '@/app/(main)/[organizationId]/pixels/[pixelId]/PixelHeader';
import { PixelMetricsBar } from '@/app/(main)/[organizationId]/pixels/[pixelId]/PixelMetricsBar';
import { PixelPanels } from '@/app/(main)/[organizationId]/pixels/[pixelId]/PixelPanels';
import { PixelProvider } from '@/app/(main)/[organizationId]/pixels/PixelProvider';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';

const excludedIds = ['path', 'entry', 'exit', 'title', 'language', 'screen', 'event'];

export function PixelPage({ pixelId }: { pixelId: string }) {
  return (
    <PixelProvider pixelId={pixelId}>
      <Grid width="100%" height="100%">
        <Column margin="2">
          <PageBody>
            <PixelHeader />
            <PixelControls pixelId={pixelId} />
            <PixelMetricsBar pixelId={pixelId} showChange={true} />
            <Panel>
              <ProjectChart projectId={pixelId} />
            </Panel>
            <PixelPanels pixelId={pixelId} />
          </PageBody>
          <ExpandedViewModal projectId={pixelId} excludedIds={excludedIds} />
        </Column>
      </Grid>
    </PixelProvider>
  );
}
