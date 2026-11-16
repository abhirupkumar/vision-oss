'use client';

import { useState } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { NotificationRulesDataTable } from './NotificationRulesDataTable';
import { NotificationsFeed } from './NotificationsFeed';
import { Bell, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export function NotificationsPage({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<'feed' | 'rules'>('feed');

  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} allowFilter={false} allowDateFilter={false} />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('feed')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
            activeTab === 'feed'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Bell size={14} />
          Notifications Feed
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
            activeTab === 'rules'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <ShieldAlert size={14} />
          Notification Rules
        </button>
      </div>

      <Panel>
        {activeTab === 'feed' ? (
          <NotificationsFeed projectId={projectId} />
        ) : (
          <NotificationRulesDataTable projectId={projectId} />
        )}
      </Panel>
    </div>
  );
}
