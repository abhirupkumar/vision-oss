'use client';
import { Column } from '@umami/react-zen';
import { LinksDataTable } from '@/app/(main)/[organizationId]/links/LinksDataTable';
import { PageBody } from '@/components/common/PageBody';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation } from '@/components/hooks';
import { LinkAddButton } from './LinkAddButton';

export function LinksPage() {
  const { formatMessage, labels } = useMessages();
  const { organizationId } = useNavigation();

  return (
    <PageBody>
      <Column gap="6" margin="2">
        <PageHeader title={formatMessage(labels.links)}>
          <LinkAddButton organizationId={organizationId} />
        </PageHeader>
        <Panel>
          <LinksDataTable />
        </Panel>
      </Column>
    </PageBody>
  );
}
