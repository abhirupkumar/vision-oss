import { DataColumn, DataTable, Dialog, Icon, MenuItem, Modal, Row, Text } from '@umami/react-zen';
import Link from 'next/link';
import { useState } from 'react';
import { ProjectDeleteForm } from '@/app/(main)/[organizationId]/[projectId]/settings/ProjectDeleteForm';
import { DateDistance } from '@/components/common/DateDistance';
import { useMessages } from '@/components/hooks';
import { Edit, Trash, Users } from '@/components/icons';
import { MenuButton } from '@/components/input/MenuButton';

export function AdminProjectsTable({ data = [] }: { data: any[] }) {
  const { formatMessage, labels } = useMessages();
  const [deleteProject, setDeleteProject] = useState(null);

  return (
    <>
      <DataTable data={data}>
        <DataColumn id="name" label={formatMessage(labels.name)}>
          {(row: any) => (
            <Text truncate>
              <Link href={`/admin/projects/${row.id}`}>{row.name}</Link>
            </Text>
          )}
        </DataColumn>
        <DataColumn id="domain" label={formatMessage(labels.domain)}>
          {(row: any) => <Text truncate>{row.domain}</Text>}
        </DataColumn>
        <DataColumn id="owner" label={formatMessage(labels.owner)}>
          {(row: any) => {
            if (row?.organization) {
              return (
                <Row alignItems="center" gap>
                  <Icon>
                    <Users />
                  </Icon>
                  <Text truncate>
                    <Link href={`/admin/organizations/${row?.organization?.id}`}>
                      {row?.organization?.name}
                    </Link>
                  </Text>
                </Row>
              );
            }
            return (
              <Text truncate>
                <Link href={`/admin/users/${row?.user?.id}`}>{row?.user?.email}</Link>
              </Text>
            );
          }}
        </DataColumn>
        <DataColumn id="created" label={formatMessage(labels.created)} width="180px">
          {(row: any) => <DateDistance date={new Date(row.createdAt)} />}
        </DataColumn>
        <DataColumn id="action" align="end" width="50px">
          {(row: any) => {
            const { id } = row;

            return (
              <MenuButton>
                <MenuItem href={`/admin/projects/${id}`} data-test="link-button-edit">
                  <Row alignItems="center" gap>
                    <Icon>
                      <Edit />
                    </Icon>
                    <Text>{formatMessage(labels.edit)}</Text>
                  </Row>
                </MenuItem>
                <MenuItem
                  id="delete"
                  onAction={() => setDeleteProject(id)}
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
      </DataTable>
      <Modal isOpen={!!deleteProject}>
        <Dialog style={{ width: 400 }}>
          <ProjectDeleteForm projectId={deleteProject} onClose={() => setDeleteProject(null)} />
        </Dialog>
      </Modal>
    </>
  );
}
