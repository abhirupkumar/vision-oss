'use client';
import { useState } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { cn } from '@/lib/cn';
import { CohortAnalysis } from './CohortAnalysis';
import { CohortsDataTable } from './CohortsDataTable';

const TABS = [
  { id: 'analysis', label: 'Cohort Analysis' },
  { id: 'saved', label: 'Saved Cohorts' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CohortsPage({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  return (
    <div className="flex flex-col gap-3">
      <ProjectControls
        projectId={projectId}
        allowFilter={false}
        allowDateFilter={activeTab === 'analysis'}
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'analysis' && <CohortAnalysis projectId={projectId} />}
      {activeTab === 'saved' && (
        <Panel>
          <CohortsDataTable projectId={projectId} />
        </Panel>
      )}
    </div>
  );
}
