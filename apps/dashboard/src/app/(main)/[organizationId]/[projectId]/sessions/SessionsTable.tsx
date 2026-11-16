'use client';
import Link from 'next/link';
import { Avatar } from '@/components/common/Avatar';
import { DateDistance } from '@/components/common/DateDistance';
import { TypeIcon } from '@/components/common/TypeIcon';
import { useFormat, useMessages, useNavigation } from '@/components/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatShortTime } from '@/lib/format';

function TruncatedId({ id, onClick }: { id: string; onClick?: () => void }) {
  if (!id) return <span className="text-muted-foreground">—</span>;
  const short = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            onClick={onClick}
            className="font-mono text-xs text-foreground cursor-pointer hover:text-primary transition-colors"
          >
            {short}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-mono text-xs">{id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VisitorCell({ row, projectId }: { row: any; projectId?: string }) {
  const { renderUrl } = useNavigation();
  const name = row.distinctId && row.distinctId !== row.visitorId ? row.distinctId : null;
  const href = projectId ? renderUrl(`/${projectId}/visitors/${row.visitorId}`, false) : undefined;

  const inner = (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar seed={row.visitorId} size={24} />
      <span className="text-xs truncate max-w-[120px] text-muted-foreground">
        {name ?? 'Anonymous'}
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function PagePath({ path }: { path?: string }) {
  if (!path) return <span className="text-muted-foreground text-xs">—</span>;
  // Show just the path, truncated
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs font-medium truncate max-w-[140px] block cursor-default">
            {path}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[320px] break-all">{path}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SessionsTable({ data = [], projectId }: { data: any[]; projectId?: string }) {
  const { formatMessage, labels } = useMessages();
  const { formatValue } = useFormat();
  const { updateParams, projectId: navProjectId, renderUrl } = useNavigation();
  const pid = projectId ?? navProjectId;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[90px]">Session ID</TableHead>
          <TableHead className="w-[140px]">Visitor</TableHead>
          <TableHead>Entry Page</TableHead>
          <TableHead>Exit Page</TableHead>
          <TableHead className="w-[80px]">Duration</TableHead>
          <TableHead className="w-[80px]">{formatMessage(labels.views)}</TableHead>
          <TableHead className="w-[80px]">{formatMessage(labels.events)}</TableHead>
          <TableHead>{formatMessage(labels.country)}</TableHead>
          <TableHead>{formatMessage(labels.browser)}</TableHead>
          <TableHead>{formatMessage(labels.device)}</TableHead>
          <TableHead className="text-right">{formatMessage(labels.lastSeen)}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row: any) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={renderUrl(`/${pid}/sessions/${row.id}`, false)}
                className="hover:underline"
              >
                <TruncatedId id={row.id} />
              </Link>
            </TableCell>
            <TableCell>
              <VisitorCell row={row} projectId={pid} />
            </TableCell>
            <TableCell>
              <PagePath path={row.entryPage} />
            </TableCell>
            <TableCell>
              <PagePath path={row.exitPage} />
            </TableCell>
            <TableCell className="tabular-nums text-xs">
              {row.duration != null
                ? formatShortTime(Number(row.duration), ['m', 's'], ' ') || '0s'
                : '—'}
            </TableCell>
            <TableCell className="font-medium tabular-nums">{row.views ?? 0}</TableCell>
            <TableCell className="font-medium tabular-nums">{row.events ?? 0}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <TypeIcon type="country" value={row.country} />
                <span className="text-xs">{formatValue(row.country, 'country')}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <TypeIcon type="browser" value={row.browser} />
                <span className="text-xs">{formatValue(row.browser, 'browser')}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <TypeIcon type="device" value={row.device} />
                <span className="text-xs">{formatValue(row.device, 'device')}</span>
              </div>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              <DateDistance date={new Date(row.createdAt)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
