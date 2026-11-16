import { DataColumn, DataTable, Dialog, Icon, MenuItem, Modal, Row, Text } from '@umami/react-zen';
import Link from 'next/link';
import { useState } from 'react';
import { OrganizationDeleteForm } from '@/app/(main)/[organizationId]/organizations/OrganizationDeleteForm';
import { DateDistance } from '@/components/common/DateDistance';
import { useMessages } from '@/components/hooks';
import { Edit, Trash } from '@/components/icons';
import { MenuButton } from '@/components/input/MenuButton';

export function AdminOrganizationsTable({
  data = [],
  showActions = true,
}: {
  data: any[];
  showActions?: boolean;
}) {
  const { formatMessage, labels } = useMessages();
  const [deleteOrganization, setDeleteOrganization] = useState(null);

  return (
    <>
      <DataTable data={data}>
        <DataColumn id="name" label={formatMessage(labels.name)} width="1fr">
          {(row: any) => <Link href={`/admin/organizations/${row.id}`}>{row.name}</Link>}
        </DataColumn>
        <DataColumn id="projects" label={formatMessage(labels.members)} width="140px">
          {(row: any) => row?._count?.members}
        </DataColumn>
        <DataColumn id="members" label={formatMessage(labels.projects)} width="140px">
          {(row: any) => row?._count?.projects}
        </DataColumn>
        <DataColumn id="owner" label={formatMessage(labels.owner)}>
          {(row: any) => {
            const name = row?.members?.[0]?.user?.email;

            return (
              <Text title={name} truncate>
                <Link href={`/admin/users/${row?.members?.[0]?.user?.id}`}>{name}</Link>
              </Text>
            );
          }}
        </DataColumn>
        <DataColumn id="created" label={formatMessage(labels.created)} width="160px">
          {(row: any) => <DateDistance date={new Date(row.createdAt)} />}
        </DataColumn>
        {showActions && (
          <DataColumn id="action" align="end" width="50px">
            {(row: any) => {
              const { id } = row;

              return (
                <MenuButton>
                  <MenuItem href={`/admin/organizations/${id}`} data-test="link-button-edit">
                    <Row alignItems="center" gap>
                      <Icon>
                        <Edit />
                      </Icon>
                      <Text>{formatMessage(labels.edit)}</Text>
                    </Row>
                  </MenuItem>
                  <MenuItem
                    id="delete"
                    onAction={() => setDeleteOrganization(id)}
                    data-test="link-button-delete"
                  >
                    <Row alignItems="center" gap>
                      <Icon>
                        <Trash />
                      </Icon>
                      <Text>{formatMessage(labels.delete)}</Text>
                    </Row>
                  </MenuItem>
                </MenuButton>
              );
            }}
          </DataColumn>
        )}
      </DataTable>
      <Modal isOpen={!!deleteOrganization}>
        <Dialog style={{ width: 400 }}>
          <OrganizationDeleteForm
            organizationId={deleteOrganization}
            onClose={() => setDeleteOrganization(null)}
          />
        </Dialog>
      </Modal>
    </>
  );
}
