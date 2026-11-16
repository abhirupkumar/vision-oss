'use client';
import { useMessages } from '@/components/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLES } from '@/lib/constants';
import { OrganizationMemberEditButton } from './OrganizationMemberEditButton';
import { OrganizationMemberRemoveButton } from './OrganizationMemberRemoveButton';

export function OrganizationMembersTable({
  data = [],
  organizationId,
  allowEdit = false,
}: {
  data: any[];
  organizationId: string;
  allowEdit: boolean;
}) {
  const { formatMessage, labels } = useMessages();

  const roles: Record<string, string> = {
    [ROLES.owner]: formatMessage(labels.organizationOwner),
    [ROLES.admin]: formatMessage(labels.admin) || 'Admin',
    member: formatMessage(labels.member) || 'Member',
    [ROLES.organizationManager]: formatMessage(labels.organizationManager),
    [ROLES.organizationMember]: formatMessage(labels.organizationMember),
    [ROLES.organizationViewOnly]: formatMessage(labels.viewOnly),
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{formatMessage(labels.email)}</TableHead>
            <TableHead>{formatMessage(labels.role)}</TableHead>
            {allowEdit && <TableHead className="text-right"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row?.user?.email}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                  {roles[row?.role] || row?.role}
                </span>
              </TableCell>
              {allowEdit && (
                <TableCell className="text-right">
                  {row?.role !== ROLES.owner && row?.role !== 'owner' && (
                    <div className="flex items-center justify-end gap-1">
                      <OrganizationMemberEditButton
                        organizationId={organizationId}
                        userId={row?.user?.id}
                        role={row?.role}
                      />
                      <OrganizationMemberRemoveButton
                        organizationId={organizationId}
                        userId={row?.user?.id}
                        email={row?.user?.email}
                      />
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
