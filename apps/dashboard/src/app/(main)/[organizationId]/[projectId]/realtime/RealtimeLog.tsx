'use client';
import { Eye, MousePointerClick, User } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { SessionModal } from '@/app/(main)/[organizationId]/[projectId]/sessions/SessionModal';
import { useFormat } from '@/components//hooks/useFormat';
import { Avatar } from '@/components/common/Avatar';
import { Empty } from '@/components/common/Empty';
import {
  useCountryNames,
  useLocale,
  useMessages,
  useMobile,
  useNavigation,
  useProject,
  useTimezone,
} from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { BROWSERS, OS_NAMES } from '@/lib/constants';

const TYPE_ALL = 'all';
const TYPE_PAGEVIEW = 'pageview';
const TYPE_SESSION = 'session';
const TYPE_EVENT = 'event';

const icons = {
  [TYPE_PAGEVIEW]: <Eye size={14} />,
  [TYPE_SESSION]: <User size={14} />,
  [TYPE_EVENT]: <MousePointerClick size={14} />,
};

export function RealtimeLog({ data }: { data: any }) {
  const project: any = useProject();
  const [search, setSearch] = useState('');
  const { formatMessage, labels, messages, FormattedMessage } = useMessages();
  const { formatValue } = useFormat();
  const { locale } = useLocale();
  const { formatTimezoneDate } = useTimezone();
  const { countryNames } = useCountryNames(locale);
  const [filter, setFilter] = useState(TYPE_ALL);
  const { updateParams } = useNavigation();
  const { isPhone } = useMobile();

  const buttons = [
    { label: formatMessage(labels.all), id: TYPE_ALL },
    { label: formatMessage(labels.views), id: TYPE_PAGEVIEW },
    { label: formatMessage(labels.visitors), id: TYPE_SESSION },
    { label: formatMessage(labels.events), id: TYPE_EVENT },
  ];

  const getTime = ({ createdAt, firstAt }) => formatTimezoneDate(firstAt || createdAt, 'pp');

  const getIcon = type => icons[type];

  const getDetail = (log: any) => {
    const { __type, eventName, urlPath, browser, os, country, device } = log;

    if (__type === TYPE_EVENT) {
      return (
        <FormattedMessage
          {...messages.eventLog}
          values={{
            event: (
              <b key="b" className="text-foreground">
                {eventName || formatMessage(labels.unknown)}
              </b>
            ),
            url: (
              <a
                key="a"
                href={`//${project?.domain}${urlPath}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                {urlPath}
              </a>
            ),
          }}
        />
      );
    }

    if (__type === TYPE_PAGEVIEW) {
      return (
        <a
          href={`//${project?.domain}${urlPath}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:underline"
        >
          {urlPath}
        </a>
      );
    }

    if (__type === TYPE_SESSION) {
      return (
        <FormattedMessage
          {...messages.visitorLog}
          values={{
            country: (
              <b key="country" className="text-foreground">
                {countryNames[country] || formatMessage(labels.unknown)}
              </b>
            ),
            browser: (
              <b key="browser" className="text-foreground">
                {BROWSERS[browser]}
              </b>
            ),
            os: (
              <b key="os" className="text-foreground">
                {OS_NAMES[os] || os}
              </b>
            ),
            device: (
              <b key="device" className="text-foreground">
                {formatMessage(labels[device] || labels.unknown)}
              </b>
            ),
          }}
        />
      );
    }
  };

  const TableRow = ({ index, style }) => {
    const row = logs[index];
    return (
      <div
        className="flex items-center gap-4 px-4 border-b border-border/50 hover:bg-accent/50 transition-colors"
        style={style}
      >
        <div className="shrink-0">
          <Link href={updateParams({ session: row.sessionId })}>
            <Avatar seed={row.sessionId} size={32} />
          </Link>
        </div>
        <div className="w-[100px] shrink-0 text-xs font-mono text-muted-foreground">
          {getTime(row)}
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="shrink-0 p-1.5 rounded-md bg-muted text-muted-foreground">
            {getIcon(row.__type)}
          </div>
          <div
            className={cn('text-sm text-muted-foreground truncate', isPhone ? 'max-w-[200px]' : '')}
            title={
              (typeof getDetail(row) === 'string' ? getDetail(row) : undefined) as unknown as
                | string
                | undefined
            }
          >
            {getDetail(row)}
          </div>
        </div>
      </div>
    );
  };

  const logs = useMemo(() => {
    if (!data) return [];
    let logs = data.events;

    if (search) {
      logs = logs.filter(({ eventName, urlPath, browser, os, country, device }) => {
        return [
          eventName,
          urlPath,
          os,
          formatValue(browser, 'browser'),
          formatValue(country, 'country'),
          formatValue(device, 'device'),
        ]
          .filter(n => n)
          .map(n => n.toLowerCase())
          .join('')
          .includes(search.toLowerCase());
      });
    }

    if (filter !== TYPE_ALL) {
      return logs.filter(({ __type }) => __type === filter);
    }

    return logs;
  }, [data, filter, formatValue, search]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-foreground">{formatMessage(labels.activity)}</h2>

      <div
        className={cn(
          'flex gap-4 items-center flex-wrap',
          isPhone ? 'flex-col' : 'justify-between',
        )}
      >
        <Input
          placeholder={formatMessage(labels.search)}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex bg-muted p-1 rounded-lg">
          {buttons.map(btn => (
            <Button
              key={btn.id}
              variant={filter === btn.id ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'rounded-md text-xs font-medium px-3',
                filter === btn.id ? 'bg-background shadow-sm' : '',
              )}
              onClick={() => setFilter(btn.id)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {logs?.length === 0 && (
          <div className="p-12">
            <Empty />
          </div>
        )}
        {logs?.length > 0 && (
          <FixedSizeList width="100%" height={500} itemCount={logs.length} itemSize={52}>
            {TableRow}
          </FixedSizeList>
        )}
      </div>
      <SessionModal projectId={project?.id} />
    </div>
  );
}
