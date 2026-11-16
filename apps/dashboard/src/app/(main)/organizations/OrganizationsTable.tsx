'use client';
import type { ReactNode } from 'react';
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

export interface OrganizationsTableProps {
  data: any[];
  renderLink?: (row: any) => ReactNode;
}

export function OrganizationsTable({ data = [], renderLink }: OrganizationsTableProps) {
  const { formatMessage, labels } = useMessages();

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{formatMessage(labels.name)}</TableHead>
            <TableHead>{formatMessage(labels.owner)}</TableHead>
            <TableHead className="text-right">{formatMessage(labels.members)}</TableHead>
            <TableHead className="text-right">{formatMessage(labels.projects)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {renderLink ? renderLink(row) : row.name}
              </TableCell>
              <TableCell>
                {row?.members?.find(({ role }) => role === ROLES.owner)?.user?.email || '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row?._count?.members || 0}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row?._count?.projects || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
