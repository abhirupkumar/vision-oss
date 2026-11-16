import { ProjectsListSkeleton } from '@/components/common/skeletons/ProjectsListSkeleton';

export default function Loading() {
  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-8 pt-0 md:px-6">
      <div className="mx-auto max-w-[1320px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border py-6 mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Search + table panel */}
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-muted" />
          </div>
          <div className="hidden grid-cols-[1fr_auto] px-4 py-2 md:grid">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </span>
          </div>
          <ProjectsListSkeleton />
        </div>
      </div>
    </div>
  );
}
