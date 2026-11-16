'use client';
import Link from 'next/link';
import { CohortDeleteButton } from '@/app/(main)/[organizationId]/[projectId]/cohorts/CohortDeleteButton';
import { CohortEditButton } from '@/app/(main)/[organizationId]/[projectId]/cohorts/CohortEditButton';
import { DateDistance } from '@/components/common/DateDistance';
import { useMessages, useNavigation } from '@/components/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function CohortsTable({ data }: { data: any }) {
  const { formatMessage, labels } = useMessages();
  const { projectId, renderUrl } = useNavigation();

  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold">{formatMessage(labels.name)}</TableHead>
            <TableHead className="font-bold">{formatMessage(labels.action)}</TableHead>
            <TableHead className="font-bold">{formatMessage(labels.created)}</TableHead>
            <TableHead className="text-right font-bold">{formatMessage(labels.actions)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data?.map((row: any) => {
            const { parameters } = row;
            const { action } = parameters || {};

            return (
              <TableRow key={row.id} className="group">
                <TableCell className="font-medium">
                  <Link
                    href={renderUrl(`/${projectId}?cohort=${row.id}`, false)}
                    className="hover:underline text-primary transition-colors"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-xs flex flex-col gap-0.5">
                    <span
                      className="text-muted-foreground uppercase tracking-wider font-bold"
                      style={{ fontSize: '10px' }}
                    >
                      {action?.type}
                    </span>
                    <span className="truncate max-w-[200px]">{action?.value}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground text-xs">
                    <DateDistance date={new Date(row.createdAt)} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CohortEditButton cohortId={row.id} projectId={projectId} />
                    <CohortDeleteButton cohortId={row.id} projectId={projectId} name={row.name} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
