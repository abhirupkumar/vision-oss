'use client';
import Link from 'next/link';
import { useMessages, useNavigation } from '@/components/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrganizationProjectRemoveButton } from './OrganizationProjectRemoveButton';

export function OrganizationProjectsTable({
  organizationId,
  data = [],
  allowEdit,
  onSave,
}: {
  organizationId: string;
  data: any[];
  allowEdit: boolean;
  onSave?: () => void;
}) {
  const { formatMessage, labels } = useMessages();
  const { renderUrl } = useNavigation();

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{formatMessage(labels.name)}</TableHead>
            <TableHead>{formatMessage(labels.domain)}</TableHead>
            <TableHead>{formatMessage(labels.createdBy)}</TableHead>
            {allowEdit && <TableHead className="text-right"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                <Link
                  href={renderUrl(`/${row.slug || row.id}`)}
                  className="text-primary hover:underline"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell>{row.domain}</TableCell>
              <TableCell>{row?.createUser?.email || '—'}</TableCell>
              {allowEdit && (
                <TableCell className="text-right">
                  <OrganizationProjectRemoveButton
                    organizationId={organizationId}
                    projectId={row.id}
                    onSave={onSave}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
