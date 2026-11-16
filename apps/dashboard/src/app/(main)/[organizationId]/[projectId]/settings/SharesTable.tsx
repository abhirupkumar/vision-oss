import { Copy, Trash2 } from 'lucide-react';
import { DataGrid } from '@/components/common/DataGrid';
import { useProjectSharesQuery } from '@/components/hooks/queries/useProjectSharesQuery';
import { useApi } from '@/components/hooks/useApi';

export function SharesTable({ projectId }: { projectId: string }) {
  const { del } = useApi();
  const queryResult = useProjectSharesQuery(projectId);

  const handleDelete = async (shareId: string) => {
    try {
      await del(`/share/id/${shareId}`);
      queryResult.refetch();
    } catch (error) {
      console.error('Failed to delete share:', error);
    }
  };

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/share/${slug}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <DataGrid query={queryResult} allowSearch allowPaging>
      {({ data }: any) => (
        <div className="divide-y divide-border">
          {data?.map((row: any) => (
            <div
              key={row.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Created: {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(row.slug)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Copy link"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DataGrid>
  );
}
