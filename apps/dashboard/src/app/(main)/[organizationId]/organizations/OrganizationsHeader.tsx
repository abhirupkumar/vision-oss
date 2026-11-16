import { Row } from '@umami/react-zen';
import { PageHeader } from '@/components/common/PageHeader';
import { useLoginQuery, useMessages } from '@/components/hooks';
import { ROLES } from '@/lib/constants';
import { OrganizationsAddButton } from './OrganizationsAddButton';
import { OrganizationsJoinButton } from './OrganizationsJoinButton';

export function OrganizationsHeader({
  allowCreate = true,
  allowJoin = true,
}: {
  allowCreate?: boolean;
  allowJoin?: boolean;
}) {
  const { formatMessage, labels } = useMessages();
  const { user } = useLoginQuery();

  return (
    <PageHeader title={formatMessage(labels.organizations)}>
      <Row gap="3">
        {allowJoin && <OrganizationsJoinButton />}
        {allowCreate && user.role !== ROLES.viewOnly && <OrganizationsAddButton />}
      </Row>
    </PageHeader>
  );
}
