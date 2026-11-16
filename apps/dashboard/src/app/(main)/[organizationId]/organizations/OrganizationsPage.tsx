'use client';
import { Column } from '@umami/react-zen';
import { OrganizationsDataTable } from '@/app/(main)/[organizationId]/organizations/OrganizationsDataTable';
import { OrganizationsHeader } from '@/app/(main)/[organizationId]/organizations/OrganizationsHeader';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';

export function OrganizationsPage() {
  return (
    <PageBody>
      <Column gap="6">
        <OrganizationsHeader />
        <Panel>
          <OrganizationsDataTable />
        </Panel>
      </Column>
    </PageBody>
  );
}
