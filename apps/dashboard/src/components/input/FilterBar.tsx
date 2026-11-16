'use client';
import { useState } from 'react';
import { SegmentEditForm } from '@/app/(main)/[organizationId]/[projectId]/segments/SegmentEditForm';
import {
  useFilters,
  useFormat,
  useMessages,
  useNavigation,
  useProjectSegmentQuery,
} from '@/components/hooks';
import { Bookmark, X } from '@/components/icons';
import { cn } from '@/lib/cn';
import { isSearchOperator } from '@/lib/params';

export function FilterBar({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();
  const { formatValue } = useFormat();
  const {
    router,
    pathname,
    updateParams,
    replaceParams,
    query: { segment, cohort },
  } = useNavigation();
  const { filters, operatorLabels } = useFilters();
  const { data, isLoading } = useProjectSegmentQuery(projectId, segment || cohort);
  const canSaveSegment = filters.length > 0 && !segment && !cohort && !pathname.includes('/share');
  const [showSegmentModal, setShowSegmentModal] = useState(false);

  const handleCloseFilter = (param: string) => {
    router.push(updateParams({ [param]: undefined }));
  };

  const handleResetFilter = () => {
    router.push(replaceParams());
  };

  const handleSegmentRemove = (type: string) => {
    router.push(updateParams({ [type]: undefined }));
  };

  if (!filters.length && !segment && !cohort) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-def-300 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {segment && !isLoading && (
          <FilterItem
            name="segment"
            label={formatMessage(labels.segment)}
            value={data?.name || segment}
            operator={operatorLabels.eq}
            onRemove={() => handleSegmentRemove('segment')}
          />
        )}
        {cohort && !isLoading && (
          <FilterItem
            name="cohort"
            label={formatMessage(labels.cohort)}
            value={data?.name || cohort}
            operator={operatorLabels.eq}
            onRemove={() => handleSegmentRemove('cohort')}
          />
        )}
        {filters.map(filter => {
          const { name, label, operator, value } = filter;
          const paramValue = isSearchOperator(operator) ? value : formatValue(value, name);

          return (
            <FilterItem
              key={name}
              name={name}
              label={label}
              operator={operatorLabels[operator]}
              value={paramValue}
              onRemove={(name: string) => handleCloseFilter(name)}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        {canSaveSegment && (
          <>
            <button
              type="button"
              title={formatMessage(labels.saveSegment)}
              onClick={() => setShowSegmentModal(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <span className="h-4 w-4">
                <Bookmark />
              </span>
            </button>

            {showSegmentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowSegmentModal(false)}
                />
                <div className="relative z-10 w-[800px] max-w-full min-h-[300px] rounded-lg border border-border bg-card p-6 shadow-xl">
                  <h2 className="mb-4 text-lg font-semibold">{formatMessage(labels.segment)}</h2>
                  <SegmentEditForm
                    projectId={projectId}
                    onClose={() => setShowSegmentModal(false)}
                    filters={filters}
                  />
                </div>
              </div>
            )}
          </>
        )}
        <button
          type="button"
          title={formatMessage(labels.clearAll)}
          onClick={handleResetFilter}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <span className="h-4 w-4">
            <X />
          </span>
        </button>
      </div>
    </div>
  );
}

const FilterItem = ({ name, label, operator, value, onRemove }) => {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm">
      <span className="flex items-center gap-1">
        <span className="font-bold text-foreground">{label}</span>
        <span className="text-muted-foreground">{operator}</span>
        <span className="font-bold text-foreground">{value}</span>
      </span>
      <button
        type="button"
        onClick={() => onRemove(name)}
        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <X />
      </button>
    </div>
  );
};
