'use client';
import { SquarePen } from 'lucide-react';
import type { ReactNode } from 'react';
import { LinkButton } from '@/components/common/LinkButton';
import { useMessages, useNavigation } from '@/components/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ProjectsTableProps {
  data: any[];
  showActions?: boolean;
  renderLink?: (row: any) => ReactNode;
}

export function ProjectsTable({ data = [], showActions, renderLink }: ProjectsTableProps) {
  const { formatMessage, labels } = useMessages();
  const { renderUrl } = useNavigation();

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{formatMessage(labels.name)}</TableHead>
            <TableHead>{formatMessage(labels.domain)}</TableHead>
            {showActions && <TableHead className="text-right"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {renderLink ? renderLink(row) : row.name}
              </TableCell>
              <TableCell className="text-muted-foreground">{row.domain}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <LinkButton
                    href={renderUrl(`/${row.id}/settings`)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <SquarePen className="h-4 w-4" />
                  </LinkButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
