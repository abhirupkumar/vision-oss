'use client';
import { useState } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { SessionModal } from '@/app/(main)/[organizationId]/[projectId]/sessions/SessionModal';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { EventsChart } from '@/components/metrics/EventsChart';
import { MetricsTable } from '@/components/metrics/MetricsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getItem, setItem } from '@/lib/storage';
import { EventProperties } from './EventProperties';
import { EventsDataTable } from './EventsDataTable';

const KEY_NAME = 'vision.events.tab';

export function EventsPage({ projectId }) {
  const [tab, setTab] = useState(getItem(KEY_NAME) || 'chart');
  const { formatMessage, labels } = useMessages();

  const handleSelect = (value: string) => {
    setItem(KEY_NAME, value);
    setTab(value);
  };

  return (
    <div className="flex flex-col gap-3">
      <ProjectControls projectId={projectId} />
      <Panel>
        <Tabs value={tab} onValueChange={handleSelect} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">{formatMessage(labels.chart)}</TabsTrigger>
            <TabsTrigger value="activity">{formatMessage(labels.activity)}</TabsTrigger>
            <TabsTrigger value="properties">{formatMessage(labels.properties)}</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <EventsDataTable projectId={projectId} />
          </TabsContent>
          <TabsContent value="chart">
            <div className="flex flex-col gap-6">
              <div className="border-b border-border pb-6">
                <EventsChart projectId={projectId} />
              </div>
              <MetricsTable
                projectId={projectId}
                type="event"
                title={formatMessage(labels.event)}
                metric={formatMessage(labels.count)}
              />
            </div>
          </TabsContent>
          <TabsContent value="properties">
            <EventProperties projectId={projectId} />
          </TabsContent>
        </Tabs>
      </Panel>
      <SessionModal projectId={projectId} />
    </div>
  );
}
