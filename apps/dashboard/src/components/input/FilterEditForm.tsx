'use client';
import { useState } from 'react';
import { useFilters, useMessages, useMobile, useNavigation } from '@/components/hooks';
import { FieldFilters } from '@/components/input/FieldFilters';
import { SegmentFilters } from '@/components/input/SegmentFilters';
import { cn } from '@/lib/cn';

export interface FilterEditFormProps {
  projectId?: string;
  onChange?: (params: { filters: any[]; segment?: string; cohort?: string }) => void;
  onClose?: () => void;
}

export function FilterEditForm({ projectId, onChange, onClose }: FilterEditFormProps) {
  const {
    query: { segment, cohort },
    pathname,
  } = useNavigation();
  const { filters } = useFilters();
  const { formatMessage, labels } = useMessages();
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [currentSegment, setCurrentSegment] = useState(segment);
  const [currentCohort, setCurrentCohort] = useState(cohort);
  const { isMobile } = useMobile();
  const excludeFilters = pathname.includes('/pixels') || pathname.includes('/links');
  const [activeTab, setActiveTab] = useState('fields');

  const handleReset = () => {
    setCurrentFilters([]);
    setCurrentSegment(undefined);
    setCurrentCohort(undefined);
  };

  const handleSave = () => {
    onChange?.({
      filters: currentFilters.filter(f => f.value),
      segment: currentSegment,
      cohort: currentCohort,
    });
    onClose?.();
  };

  const handleSegmentChange = (id: string, type: string) => {
    setCurrentSegment(type === 'segment' ? id : undefined);
    setCurrentCohort(type === 'cohort' ? id : undefined);
  };

  const tabs = [
    { id: 'fields', label: formatMessage(labels.fields) },
    ...(!excludeFilters
      ? [
          { id: 'segments', label: formatMessage(labels.segments) },
          { id: 'cohorts', label: formatMessage(labels.cohorts) },
        ]
      : []),
  ];

  const btnClass =
    'rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent';

  return (
    <div className="flex flex-col gap-6" style={{ width: isMobile ? 'auto' : '800px' }}>
      <div className="flex min-h-[500px] flex-col gap-3">
        {/* Tab list */}
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'fields' && (
            <FieldFilters
              projectId={projectId}
              value={currentFilters}
              onChange={setCurrentFilters}
              exclude={excludeFilters ? ['path', 'title', 'hostname', 'tag', 'event'] : []}
            />
          )}
          {activeTab === 'segments' && (
            <SegmentFilters
              projectId={projectId}
              segmentId={currentSegment}
              onChange={handleSegmentChange}
            />
          )}
          {activeTab === 'cohorts' && (
            <SegmentFilters
              type="cohort"
              projectId={projectId}
              segmentId={currentCohort}
              onChange={handleSegmentChange}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={handleReset} className={btnClass}>
          {formatMessage(labels.reset)}
        </button>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={btnClass}>
            {formatMessage(labels.cancel)}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {formatMessage(labels.apply)}
          </button>
        </div>
      </div>
    </div>
  );
}
