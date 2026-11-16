'use client';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { toast } from 'sonner';
import { EventsDataTable } from '@/app/(main)/[organizationId]/[projectId]/events/EventsDataTable';
import { SessionsDataTable } from '@/app/(main)/[organizationId]/[projectId]/sessions/SessionsDataTable';
import { VisitorActivity } from '@/app/(main)/[organizationId]/[projectId]/visitors/VisitorActivity';
import { Avatar } from '@/components/common/Avatar';
import { DateDistance } from '@/components/common/DateDistance';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { TypeIcon } from '@/components/common/TypeIcon';
import {
  useFormat,
  useLocale,
  useMessages,
  useNavigation,
  useProjectVisitorQuery,
  useRegionNames,
} from '@/components/hooks';
import { Activity } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { ReplayModal } from '@/app/(main)/[organizationId]/[projectId]/replays/ReplayModal';
import { ReplaysDataTable } from '@/app/(main)/[organizationId]/[projectId]/replays/ReplaysDataTable';
import { ReplaysTable } from '@/app/(main)/[organizationId]/[projectId]/replays/ReplaysTable';

export function VisitorProfilePage({
  projectId,
  visitorId,
}: {
  projectId: string;
  visitorId: string;
}) {
  const { data, isLoading, error } = useProjectVisitorQuery(projectId, visitorId);
  const { formatMessage, labels } = useMessages();
  const { renderUrl } = useNavigation();
  const { locale } = useLocale();
  const { formatValue } = useFormat();
  const { getRegionName } = useRegionNames(locale);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(visitorId);
    toast('Copied!');
  };

  const isIdentified = data?.distinctId && data.distinctId !== visitorId;

  // Determine display name from profile fields or fallback
  const fullName =
    data?.firstName || data?.lastName
      ? [data.firstName, data.lastName].filter(Boolean).join(' ')
      : null;
  const visitorName = fullName || (isIdentified ? data.distinctId : 'Anonymous');

  // Metrics
  const avgEventsPerSession = data?.sessions ? (data.events / data.sessions).toFixed(1) : '0';
  const avgDuration = data?.sessions ? Math.round(data.totaltime / data.sessions) + 's' : '0s';

  const metrics = [
    { label: 'Total Events', value: data?.events || 0 },
    { label: 'Sessions', value: data?.sessions || 0 },
    { label: 'Page Views', value: data?.views || 0 },
    { label: 'Avg Events/Session', value: avgEventsPerSession },
    { label: 'Bounce Rate', value: '0%' },
    { label: 'Session Duration (Avg)', value: avgDuration },
    { label: 'Session Duration (P90)', value: '0s' },
    {
      label: 'First seen',
      value: data?.firstAt ? <DateDistance date={new Date(data.firstAt)} /> : '—',
    },
    {
      label: 'Last seen',
      value: data?.lastAt ? <DateDistance date={new Date(data.lastAt)} /> : '—',
    },
    { label: 'Days Active', value: data?.sessions ? 1 : 0 },
    { label: 'Conversion Events', value: 0 },
    { label: 'Avg Time Between Sessions (h)', value: '0s' },
  ];

  // Flatten custom properties for display
  const customProperties =
    data?.properties && typeof data.properties === 'object'
      ? Object.entries(data.properties as Record<string, unknown>).filter(([, v]) => v != null)
      : [];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1320px] mx-auto w-full">
      <LoadingPanel data={data} isLoading={isLoading} error={error} minHeight="400px">
        {data && (
          <div className="flex flex-col">
            {/* Header section */}
            <div className="flex items-start gap-4 mb-6">
              {data.avatar ? (
                <img
                  src={data.avatar}
                  alt={visitorName}
                  className="rounded-full object-cover"
                  style={{ width: 48, height: 48 }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Avatar seed={visitorId} size={48} />
              )}
              <div className="flex flex-col gap-1.5 mt-0.5">
                <div className="flex items-center gap-2">
                  {fullName ? (
                    <h1 className="text-xl font-bold text-foreground leading-none">{fullName}</h1>
                  ) : (
                    <h1 className="text-xl font-normal text-muted-foreground leading-none">Name not provided</h1>
                  )}
                  {isIdentified && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Identified
                    </span>
                  )}
                </div>
                {data.email && <p className="text-sm text-muted-foreground">{data.email}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                  {data?.country && (
                    <div className="flex items-center gap-1.5">
                      <TypeIcon type="country" value={data.country} />
                      <span>{formatValue(data.country, 'country')}</span>
                      {data.region && (
                        <span>/ {getRegionName(data.region, data.country, false)}</span>
                      )}
                      {data.city && <span>/ {data.city}</span>}
                    </div>
                  )}
                  {data?.device && (
                    <div className="flex items-center gap-1.5">
                      <TypeIcon type="device" value={data.device} />
                      <span className="capitalize">{formatValue(data.device, 'device')}</span>
                    </div>
                  )}
                  {data?.os && (
                    <div className="flex items-center gap-1.5">
                      <TypeIcon type="os" value={data.os?.toLowerCase()?.replaceAll(/\W/g, '-')} />
                      <span>{formatValue(data.os, 'os')}</span>
                    </div>
                  )}
                  {data?.browser && (
                    <div className="flex items-center gap-1.5">
                      <TypeIcon type="browser" value={data.browser} />
                      <span>{formatValue(data.browser, 'browser')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-6">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5 font-medium"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5 font-medium"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5 font-medium"
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="replays"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5 font-medium"
                >
                  Replays
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0 outline-none">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-4 mb-8">
                  {metrics.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                      <span className="text-xl font-semibold text-foreground tracking-tight">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Profile Information Block */}
                <div className="border border-border rounded-lg bg-card overflow-hidden mb-6 shadow-sm">
                  <div className="bg-muted/30 px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Profile Information</h3>
                  </div>
                  <div className="p-0 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-t border-transparent text-sm">
                      {/* Column 1 */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Id</span>
                          <span className="font-mono text-xs max-w-[150px] truncate">
                            {visitorId}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Distinct ID</span>
                          <span className="font-mono text-xs max-w-[150px] truncate" title={data?.distinctId}>
                            {data?.distinctId || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Email</span>
                          <span className="text-xs truncate max-w-[150px]">
                            {data?.email || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b md:border-b-0">
                          <span className="text-xs text-muted-foreground">Country</span>
                          <span className="flex items-center gap-1.5 text-xs">
                            <TypeIcon type="country" value={data?.country} />
                            {formatValue(data?.country, 'country')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-transparent hidden lg:flex">
                          <span className="text-xs text-muted-foreground">Latitude</span>
                          <span className="text-xs">
                            {data?.latitude ? data.latitude.toString() : '—'}
                          </span>
                        </div>
                      </div>
                      {/* Column 2 */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">First Name</span>
                          <span className="text-xs">{data?.firstName || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Last Name</span>
                          <span className="text-xs">{data?.lastName || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b md:border-b-0">
                          <span className="text-xs text-muted-foreground">City</span>
                          <span className="flex items-center gap-1.5 text-xs">
                            {data?.city || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b border-transparent hidden lg:flex">
                          <span className="text-xs text-muted-foreground">Longitude</span>
                          <span className="text-xs">
                            {data?.longitude ? data.longitude.toString() : '—'}
                          </span>
                        </div>
                      </div>
                      {/* Column 3 */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Created At</span>
                          <span className="text-xs">
                            {data?.firstAt ? format(new Date(data.firstAt), 'dd MMM, HH:mm') : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Last Seen</span>
                          <span className="text-xs">
                            {data?.lastAt ? format(new Date(data.lastAt), 'dd MMM, HH:mm') : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">OS</span>
                          <span className="flex items-center gap-1.5 text-xs">
                            <TypeIcon
                              type="os"
                              value={data.os?.toLowerCase()?.replaceAll(/\W/g, '-')}
                            />
                            {formatValue(data?.os, 'os')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b lg:border-b-0 lg:hidden">
                          <span className="text-xs text-muted-foreground">Latitude</span>
                          <span className="text-xs">
                            {data?.latitude ? data.latitude.toString() : '—'}
                          </span>
                        </div>
                      </div>
                      {/* Column 4 */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Browser</span>
                          <span className="flex items-center gap-1.5 text-xs">
                            <TypeIcon type="browser" value={data?.browser} />
                            {formatValue(data?.browser, 'browser')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Device</span>
                          <span className="flex items-center gap-1.5 text-xs">
                            <TypeIcon type="device" value={data?.device} />
                            {formatValue(data?.device, 'device')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b">
                          <span className="text-xs text-muted-foreground">Language</span>
                          <span className="text-xs">{data?.language || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 border-b lg:border-b-0 lg:hidden">
                          <span className="text-xs text-muted-foreground">Longitude</span>
                          <span className="text-xs">
                            {data?.longitude ? data.longitude.toString() : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Properties Block — only shown if visitor has properties */}
                {customProperties.length > 0 && (
                  <div className="border border-border rounded-lg bg-card overflow-hidden mb-6 shadow-sm">
                    <div className="bg-muted/30 px-4 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">Custom Properties</h3>
                    </div>
                    <div className="divide-y">
                      {customProperties.map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center px-4 py-3">
                          <span className="text-xs text-muted-foreground font-mono">{key}</span>
                          <span className="text-xs font-medium max-w-[200px] truncate">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid for Activity and Latest Events */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {/* Activity Calendar Mock */}
                  <div className="border border-border rounded-lg bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Activity
                      </h3>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-sm">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      {['February 2026', 'March 2026', 'April 2026', 'May 2026'].map(
                        (month, mi) => (
                          <div key={month}>
                            <h4 className="text-[11px] font-medium text-muted-foreground mb-3">
                              {month}
                            </h4>
                            <div className="grid grid-cols-7 gap-1.5">
                              {Array.from({ length: 30 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`aspect-square rounded-[2px] ${mi === 3 && i === 25 ? 'bg-primary' : 'bg-muted'}`}
                                  title={mi === 3 && i === 25 ? '1 event' : '0 events'}
                                />
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Latest Events */}
                  <div className="border border-border rounded-lg bg-card flex flex-col shadow-sm max-h-[500px]">
                    <div className="flex items-center justify-between p-5 pb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Latest Events
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-medium rounded-sm"
                      >
                        All
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto p-5 pt-0">
                      <VisitorActivity projectId={projectId} visitorId={visitorId} />
                    </div>
                  </div>
                </div>

                {/* Charts Mockups */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <div className="border border-border rounded-lg bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold mb-6">Page views</h3>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { date: '1 May', value: 0 },
                            { date: '8 May', value: 0 },
                            { date: '15 May', value: 0 },
                            { date: '22 May', value: 0 },
                            { date: '29 May', value: 0 },
                            { date: '31 May', value: 1 },
                          ]}
                        >
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                          />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              fontSize: '12px',
                              background: 'var(--card)',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold mb-6">Events per day</h3>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { date: '1 May', session_start: 0, screen_view: 0 },
                            { date: '8 May', session_start: 0, screen_view: 0 },
                            { date: '15 May', session_start: 0, screen_view: 0 },
                            { date: '22 May', session_start: 0, screen_view: 0 },
                            { date: '29 May', session_start: 0, screen_view: 0 },
                            { date: '31 May', session_start: 1, screen_view: 1 },
                          ]}
                        >
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                          />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              fontSize: '12px',
                              background: 'var(--card)',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="session_start"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="screen_view"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-[10px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="text-blue-500">Events</span> {'>'} session_start
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-destructive">Events</span> {'>'} screen_view
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                <EventsDataTable
                  projectId={projectId}
                  visitorId={visitorId}
                  startAt={data?.firstAt ? new Date(data.firstAt).getTime() : 0}
                  endAt={
                    data?.lastAt
                      ? new Date(data.lastAt).getTime() + 86400000
                      : Date.now() + 86400000
                  }
                />
              </TabsContent>
              <TabsContent value="sessions" className="mt-4">
                <SessionsDataTable
                  projectId={projectId}
                  visitorId={visitorId}
                  startAt={data?.firstAt ? new Date(data.firstAt).getTime() : 0}
                  endAt={
                    data?.lastAt
                      ? new Date(data.lastAt).getTime() + 86400000
                      : Date.now() + 86400000
                  }
                />
              </TabsContent>
              <TabsContent value="replays" className="mt-4">
                <ReplaysDataTable projectId={projectId} params={{ visitorId }}>
                  {({ data }) => (
                    <ReplaysTable data={data} onSelect={setSelectedSessionId} />
                  )}
                </ReplaysDataTable>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </LoadingPanel>

      {selectedSessionId && (
        <ReplayModal
          projectId={projectId}
          sessionId={selectedSessionId}
          open={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
