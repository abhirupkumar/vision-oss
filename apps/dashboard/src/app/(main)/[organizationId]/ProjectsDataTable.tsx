import { SquarePen } from 'lucide-react';
import Link from 'next/link';
import { DataGrid } from '@/components/common/DataGrid';
import { useLoginQuery, useNavigation, useUserProjectsQuery } from '@/components/hooks';
import { Favicon } from '@/index';
import { cn } from '@/lib/cn';

export function ProjectsDataTable({
  userId,
  organizationId,
  allowEdit = true,
  allowView = true,
  showActions = true,
}: {
  userId?: string;
  organizationId?: string;
  allowEdit?: boolean;
  allowView?: boolean;
  showActions?: boolean;
}) {
  const { user } = useLoginQuery();
  const queryResult = useUserProjectsQuery({ userId: userId || user?.id, organizationId });
  const { renderUrl } = useNavigation();

  return (
    <DataGrid query={queryResult} allowSearch allowPaging>
      {({ data }) => (
        <div className="divide-y divide-border">
          {data?.map((row: any) => (
            <div
              key={row.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                <Favicon domain={row.domain} />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={renderUrl(`/${row.id}`, false)}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {row.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{row.domain}</p>
              </div>
              {showActions && (
                <Link
                  href={renderUrl(`/${row.id}/settings`, false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  title="Edit"
                >
                  <SquarePen size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </DataGrid>
  );
}
