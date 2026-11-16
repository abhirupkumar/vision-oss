'use client';
import { OrganizationLeaveButton } from '@/app/(main)/[organizationId]/organizations/OrganizationLeaveButton';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useLoginQuery, useNavigation, useOrganization } from '@/components/hooks';
import { Users } from '@/components/icons';
import { ROLES } from '@/lib/constants';
import { OrganizationEditForm } from './OrganizationEditForm';
import { OrganizationManage } from './OrganizationManage';
import { OrganizationMembersDataTable } from './OrganizationMembersDataTable';

export function OrganizationSettings({ organizationId }: { organizationId: string }) {
  const organization: any = useOrganization();
  const { user } = useLoginQuery();
  const { pathname } = useNavigation();

  const isAdmin = pathname.includes('/admin');

  const isOrganizationOwner =
    !!organization?.members?.find(
      ({ userId, role }) => (role === ROLES.owner || role === 'owner') && userId === user?.id,
    ) && user?.role !== ROLES.viewOnly;

  const canEdit =
    user?.isAdmin ||
    (!!organization?.members?.find(
      ({ userId, role }) =>
        (role === ROLES.owner ||
          role === 'owner' ||
          role === ROLES.admin ||
          role === 'admin' ||
          role === ROLES.organizationManager) &&
        userId === user?.id,
    ) &&
      user?.role !== ROLES.viewOnly);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={organization?.name} icon={<Users />}>
        {!isOrganizationOwner && !isAdmin && (
          <OrganizationLeaveButton
            organizationId={organization.id}
            organizationName={organization.name}
          />
        )}
      </PageHeader>
      <Panel>
        <OrganizationEditForm
          organizationId={organizationId}
          allowEdit={canEdit}
          showAccessCode={canEdit}
        />
      </Panel>
      <Panel>
        <OrganizationMembersDataTable organizationId={organizationId} allowEdit={canEdit} />
      </Panel>
      {isOrganizationOwner && (
        <Panel>
          <OrganizationManage organizationId={organizationId} />
        </Panel>
      )}
    </div>
  );
}
