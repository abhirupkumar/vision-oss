'use client';
import { useState } from 'react';
import { Panel } from '@/components/common/Panel';
import { useMessages, useNavigation } from '@/components/hooks';
import { EventsChart } from '@/components/metrics/EventsChart';
import { MetricsTable } from '@/components/metrics/MetricsTable';
import { WeeklyTraffic } from '@/components/metrics/WeeklyTraffic';
import { WorldMap } from '@/components/metrics/WorldMap';
import { cn } from '@/lib/cn';

function Tabs({
  tabs,
  children,
}: {
  tabs: { id: string; label: string }[];
  children: (activeTab: string) => React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children(activeTab)}</div>
    </div>
  );
}

export function ProjectPanels({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();
  const { pathname } = useNavigation();
  const tableProps = {
    projectId,
    limit: 10,
    allowDownload: false,
    showMore: true,
    metric: formatMessage(labels.visitors),
    useBatch: true,
    batchTypes: [
      'path',
      'entry',
      'exit',
      'referrer',
      'channel',
      'browser',
      'os',
      'device',
      'country',
      'region',
      'city',
      'event',
    ],
  };
  const isSharePage = pathname.includes('/share/');

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Pages + Sources */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel>
          <Tabs
            tabs={[
              { id: 'path', label: formatMessage(labels.path) },
              { id: 'entry', label: formatMessage(labels.entry) },
              { id: 'exit', label: formatMessage(labels.exit) },
            ]}
          >
            {activeTab => (
              <>
                {activeTab === 'path' && (
                  <MetricsTable type="path" title={formatMessage(labels.path)} {...tableProps} />
                )}
                {activeTab === 'entry' && (
                  <MetricsTable type="entry" title={formatMessage(labels.path)} {...tableProps} />
                )}
                {activeTab === 'exit' && (
                  <MetricsTable type="exit" title={formatMessage(labels.path)} {...tableProps} />
                )}
              </>
            )}
          </Tabs>
        </Panel>

        <Panel>
          <Tabs
            tabs={[
              { id: 'referrer', label: formatMessage(labels.referrers) },
              { id: 'channel', label: formatMessage(labels.channels) },
            ]}
          >
            {activeTab => (
              <>
                {activeTab === 'referrer' && (
                  <MetricsTable
                    type="referrer"
                    title={formatMessage(labels.referrer)}
                    {...tableProps}
                  />
                )}
                {activeTab === 'channel' && (
                  <MetricsTable
                    type="channel"
                    title={formatMessage(labels.channel)}
                    {...tableProps}
                  />
                )}
              </>
            )}
          </Tabs>
        </Panel>
      </div>

      {/* Row 2: Environment + Location */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel>
          <Tabs
            tabs={[
              { id: 'browser', label: formatMessage(labels.browsers) },
              { id: 'os', label: formatMessage(labels.os) },
              { id: 'device', label: formatMessage(labels.devices) },
            ]}
          >
            {activeTab => (
              <>
                {activeTab === 'browser' && (
                  <MetricsTable
                    type="browser"
                    title={formatMessage(labels.browser)}
                    {...tableProps}
                  />
                )}
                {activeTab === 'os' && (
                  <MetricsTable type="os" title={formatMessage(labels.os)} {...tableProps} />
                )}
                {activeTab === 'device' && (
                  <MetricsTable
                    type="device"
                    title={formatMessage(labels.device)}
                    {...tableProps}
                  />
                )}
              </>
            )}
          </Tabs>
        </Panel>

        <Panel>
          <Tabs
            tabs={[
              { id: 'country', label: formatMessage(labels.countries) },
              { id: 'region', label: formatMessage(labels.regions) },
              { id: 'city', label: formatMessage(labels.cities) },
            ]}
          >
            {activeTab => (
              <>
                {activeTab === 'country' && (
                  <MetricsTable
                    type="country"
                    title={formatMessage(labels.country)}
                    {...tableProps}
                  />
                )}
                {activeTab === 'region' && (
                  <MetricsTable
                    type="region"
                    title={formatMessage(labels.region)}
                    {...tableProps}
                  />
                )}
                {activeTab === 'city' && (
                  <MetricsTable type="city" title={formatMessage(labels.city)} {...tableProps} />
                )}
              </>
            )}
          </Tabs>
        </Panel>
      </div>

      {/* Row 3: World Map + Weekly Traffic */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Panel className="md:col-span-2 !p-0">
          <WorldMap projectId={projectId} />
        </Panel>
        <Panel title={formatMessage(labels.traffic)}>
          <div className="border-b border-border mb-4" />
          <WeeklyTraffic projectId={projectId} />
        </Panel>
      </div>

      {/* Row 4: Events (share page only) */}
      {isSharePage && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Panel title={formatMessage(labels.events)} className="md:col-span-1">
            <MetricsTable
              projectId={projectId}
              type="event"
              title={formatMessage(labels.event)}
              metric={formatMessage(labels.count)}
              limit={15}
              filterLink={false}
              useBatch={true}
              batchTypes={tableProps.batchTypes}
            />
          </Panel>
          <Panel className="md:col-span-2">
            <EventsChart projectId={projectId} />
          </Panel>
        </div>
      )}
    </div>
  );
}
