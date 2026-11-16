export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
