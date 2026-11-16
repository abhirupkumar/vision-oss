export function ProjectsListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
        >
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded-md bg-muted/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
