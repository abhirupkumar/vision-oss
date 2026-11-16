'use client';
import Link from 'next/link';
import { SegmentDeleteButton } from '@/app/(main)/[organizationId]/[projectId]/segments/SegmentDeleteButton';
import { SegmentEditButton } from '@/app/(main)/[organizationId]/[projectId]/segments/SegmentEditButton';
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

export function SegmentsTable({ data }: { data: any }) {
  const { formatMessage, labels } = useMessages();
  const { projectId, renderUrl } = useNavigation();

  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold">{formatMessage(labels.name)}</TableHead>
            <TableHead className="font-bold">{formatMessage(labels.created)}</TableHead>
            <TableHead className="text-right font-bold">{formatMessage(labels.actions)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data?.map((row: any) => (
            <TableRow key={row.id} className="group">
              <TableCell className="font-medium">
                <Link
                  href={renderUrl(`/${projectId}?segment=${row.id}`, false)}
                  className="hover:underline text-primary transition-colors"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell>
                <div className="text-muted-foreground text-xs">
                  <DateDistance date={new Date(row.createdAt)} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SegmentEditButton segmentId={row.id} projectId={projectId} />
                  <SegmentDeleteButton segmentId={row.id} projectId={projectId} name={row.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
