import { Panel } from '@/components/common/Panel';
import { TableSkeleton } from './TableSkeleton';

export function ProjectPanelsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Pages + Sources */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel>
          <div className="mb-4 flex gap-4 border-b border-border pb-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
          <TableSkeleton />
        </Panel>

        <Panel>
          <div className="mb-4 flex gap-4 border-b border-border pb-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
          <TableSkeleton />
        </Panel>
      </div>

      {/* Row 2: Environment + Location */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel>
          <div className="mb-4 flex gap-4 border-b border-border pb-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
          <TableSkeleton />
        </Panel>

        <Panel>
          <div className="mb-4 flex gap-4 border-b border-border pb-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
          <TableSkeleton />
        </Panel>
      </div>
    </div>
  );
}
