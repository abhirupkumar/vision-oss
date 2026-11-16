'use client';
import { isSameDay } from 'date-fns';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useMessages, useMobile, useSessionActivityQuery, useTimezone } from '@/components/hooks';
import { Eye, FileText, Zap } from '@/components/icons';
import { EventData } from '@/components/metrics/EventData';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function SessionActivity({
  projectId,
  sessionId,
  startDate,
  endDate,
}: {
  projectId: string;
  sessionId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { formatMessage, labels } = useMessages();
  const { formatTimezoneDate } = useTimezone();
  const { data, isLoading, error } = useSessionActivityQuery(
    projectId,
    sessionId,
    startDate,
    endDate,
  );
  const { isMobile } = useMobile();
  let lastDay = null;

  return (
    <LoadingPanel data={data} isLoading={isLoading} error={error}>
      <div className="flex flex-col gap-1">
        {data?.map(
          ({ eventId, createdAt, urlPath, eventName, sessionId: itemSessionId, hasData }) => {
            const showHeader = !lastDay || !isSameDay(new Date(lastDay), new Date(createdAt));
            lastDay = createdAt;

            return (
              <div key={eventId} className="flex flex-col">
                {showHeader && (
                  <div className="flex items-center gap-4 my-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                      {formatTimezoneDate(createdAt, 'PPPP')}
                    </h3>
                    <div className="h-[1px] w-full bg-border/50" />
                  </div>
                )}
                <div className="flex items-center gap-4 h-9 group hover:bg-muted/30 px-2 rounded-md transition-colors">
                  <div className="flex items-center gap-3 shrink-0 w-24">
                    <div
                      className="w-1.5 h-1.5 rounded-full ring-2 ring-background"
                      style={{ backgroundColor: `#${itemSessionId?.substring(0, 6)}` }}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {formatTimezoneDate(createdAt, 'pp')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">
                        {eventName ? (
                          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                        )}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate max-w-[400px]">
                        {eventName || urlPath}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                        {eventName
                          ? formatMessage(labels.triggeredEvent)
                          : formatMessage(labels.viewedPage)}
                      </span>
                    </div>
                    <div className="ml-auto">
                      {hasData > 0 && <PropertiesButton projectId={projectId} eventId={eventId} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>
    </LoadingPanel>
  );
}

const PropertiesButton = ({ projectId, eventId }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <FileText size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-[400px] p-0">
        <div className="p-4 overflow-auto max-h-[400px]">
          <EventData projectId={projectId} eventId={eventId} />
        </div>
      </PopoverContent>
    </Popover>
  );
};
