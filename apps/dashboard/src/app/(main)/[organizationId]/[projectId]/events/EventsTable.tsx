import Link from 'next/link';
import { Avatar } from '@/components/common/Avatar';
import { DateDistance } from '@/components/common/DateDistance';
import { TypeIcon } from '@/components/common/TypeIcon';
import { useFormat, useMessages, useNavigation } from '@/components/hooks';
import { Eye, FileText, Zap } from '@/components/icons';
import { EventData } from '@/components/metrics/EventData';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function EventsTable({ data }: { data: any[] }) {
  const { formatMessage, labels, messages } = useMessages();
  const { updateParams } = useNavigation();
  const { formatValue } = useFormat();

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 text-muted-foreground">
        {formatMessage(messages.noDataAvailable)}
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">{formatMessage(labels.event)}</TableHead>
            <TableHead>{formatMessage(labels.session)}</TableHead>
            <TableHead>{formatMessage(labels.location)}</TableHead>
            <TableHead>{formatMessage(labels.browser)}</TableHead>
            <TableHead>{formatMessage(labels.device)}</TableHead>
            <TableHead className="text-right">{formatMessage(labels.created)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {row.eventName ? (
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                    ) : (
                      <Eye className="h-3 w-3 text-blue-500" />
                    )}
                    <span>
                      {formatMessage(row.eventName ? labels.triggeredEvent : labels.viewedPage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-semibold truncate max-w-[300px] text-foreground"
                      title={row.eventName || row.urlPath}
                    >
                      {row.eventName || row.urlPath}
                    </span>
                    {row.hasData > 0 && (
                      <PropertiesButton projectId={row.projectId} eventId={row.id} />
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Link href={updateParams({ session: row.sessionId })}>
                  <Avatar
                    seed={row.sessionId}
                    size={28}
                    className="hover:ring-2 ring-primary/50 transition-all cursor-pointer"
                  />
                </Link>
              </TableCell>
              <TableCell>
                <TypeIcon type="country" value={row.country}>
                  {row.city ? `${row.city}, ` : ''} {formatValue(row.country, 'country')}
                </TypeIcon>
              </TableCell>
              <TableCell>
                <TypeIcon type="browser" value={row.browser}>
                  {formatValue(row.browser, 'browser')}
                </TypeIcon>
              </TableCell>
              <TableCell>
                <TypeIcon type="device" value={row.device}>
                  {formatValue(row.device, 'device')}
                </TypeIcon>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap text-muted-foreground text-xs font-medium">
                <DateDistance date={new Date(row.createdAt)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const PropertiesButton = ({ projectId, eventId }: { projectId: string; eventId: string }) => {
  const { formatMessage, labels } = useMessages();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{formatMessage(labels.properties)}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <EventData projectId={projectId} eventId={eventId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
