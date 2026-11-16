'use client';
import { useState } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';

import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getItem, setItem } from '@/lib/storage';
import { SessionProperties } from './SessionProperties';
import { SessionsDataTable } from './SessionsDataTable';

const KEY_NAME = 'vision.sessions.tab';

export function SessionsPage({ projectId }) {
  const [tab, setTab] = useState(getItem(KEY_NAME) || 'activity');
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
            <TabsTrigger value="activity">{formatMessage(labels.activity)}</TabsTrigger>
            <TabsTrigger value="properties">{formatMessage(labels.properties)}</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <SessionsDataTable projectId={projectId} />
          </TabsContent>
          <TabsContent value="properties">
            <SessionProperties projectId={projectId} />
          </TabsContent>
        </Tabs>
      </Panel>
    </div>
  );
}
