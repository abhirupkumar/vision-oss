import { Play, Trash2 } from 'lucide-react';

export function SavedReplaysTable({
  data,
  onDelete,
}: {
  data: any[];
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-border">
      {data?.map((row: any) => (
        <div
          key={row.id}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
            <Play size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {new Date(row.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => onDelete?.(row.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
