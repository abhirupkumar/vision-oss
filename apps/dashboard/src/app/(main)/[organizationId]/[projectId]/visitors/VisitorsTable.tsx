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

function TruncatedId({ id }: { id: string }) {
  if (!id) return <span className="text-muted-foreground">—</span>;
  const short = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-xs text-foreground cursor-default">{short}</span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-mono text-xs">{id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function VisitorsTable({ data = [], identified }: { data: any[]; identified?: boolean }) {
  const { formatMessage, labels } = useMessages();
  const { formatValue } = useFormat();
  const { renderUrl, projectId } = useNavigation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-13"></TableHead>
          <TableHead className="w-22.5">ID</TableHead>
          <TableHead className="w-40">{identified ? 'Name' : 'Visitor'}</TableHead>
          {identified && <TableHead className="w-45">Email</TableHead>}
          <TableHead className="w-17.5">Sessions</TableHead>
          <TableHead className="w-17.5">{formatMessage(labels.views)}</TableHead>
          <TableHead className="w-17.5">{formatMessage(labels.events)}</TableHead>
          <TableHead>{formatMessage(labels.country)}</TableHead>
          <TableHead>{formatMessage(labels.browser)}</TableHead>
          <TableHead>{formatMessage(labels.device)}</TableHead>
          <TableHead>First Seen</TableHead>
          <TableHead className="text-right">{formatMessage(labels.lastSeen)}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={identified ? 12 : 11}
              className="text-center text-muted-foreground text-sm py-10"
            >
              No {identified === true ? 'identified' : identified === false ? 'anonymous' : ''}{' '}
              visitors found.
            </TableCell>
          </TableRow>
        ) : (
          data.map((row: any) => {
            const fullName =
              row.firstName || row.lastName
                ? [row.firstName, row.lastName].filter(Boolean).join(' ')
                : null;
            const profileHref = renderUrl(`/${projectId}/visitors/${row.id}`, false);

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <Link href={profileHref}>
                    {row.avatar ? (
                      <img
                        src={row.avatar}
                        alt={fullName ?? 'Visitor'}
                        className="rounded-full object-cover"
                        style={{ width: 32, height: 32 }}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Avatar seed={row.id} size={32} />
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <TruncatedId id={row.id} />
                </TableCell>
                <TableCell>
                  <Link
                    href={profileHref}
                    className="text-xs font-medium text-foreground hover:underline truncate max-w-37.5 block"
                  >
                    {fullName ? (
                      fullName
                    ) : identified ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-muted-foreground italic">Anonymous</span>
                    )}
                  </Link>
                </TableCell>
                {identified && (
                  <TableCell>
                    <span className="text-xs text-muted-foreground truncate max-w-42.5 block">
                      {row.email || '—'}
                    </span>
                  </TableCell>
                )}
                <TableCell className="font-medium tabular-nums">{row.sessions ?? 0}</TableCell>
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
                <TableCell className="whitespace-nowrap">
                  {row.firstAt ? <DateDistance date={new Date(row.firstAt)} /> : '—'}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <DateDistance date={new Date(row.createdAt)} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
