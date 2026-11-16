'use client';
import { SquarePen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Favicon } from '@/components/common/Favicon';
import { useLoginQuery, useNavigation, useUserProjectsQuery } from '@/components/hooks';
import { cn } from '@/lib/cn';
import { ProjectAddButton } from './ProjectAddButton';

function ProjectRow({
  project,
  showActions,
  renderUrl,
}: {
  project: any;
  showActions: boolean;
  renderUrl: (path: string, params?: any) => string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-accent/50 transition-colors">
      {/* Favicon + name */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
          <Favicon domain={project.domain} />
        </div>
        <div className="min-w-0">
          <Link
            href={renderUrl(`/${project.slug || project.id}`, false)}
            className="block truncate text-sm font-medium text-foreground hover:underline"
          >
            {project.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{project.domain}</p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <Link
          href={renderUrl(`/${project.slug || project.id}/settings`, false)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Edit project"
        >
          <SquarePen size={15} />
        </Link>
      )}
    </div>
  );
}

export function ProjectsPage({ initialProjects }: { initialProjects?: any[] }) {
  const { user } = useLoginQuery();
  const { renderUrl, organizationId } = useNavigation();
  const queryResult = useUserProjectsQuery({ userId: user?.id, organizationId });
  const { data, isLoading, isFetching } = queryResult;
  const [search, setSearch] = useState('');

  const projects = initialProjects || data?.data || [];
  const filtered = search
    ? projects.filter(
      w =>
        w.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.domain?.toLowerCase().includes(search.toLowerCase()),
    )
    : projects;

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-8 pt-0 md:px-6">
      <div className="mx-auto max-w-330">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border py-6 mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <ProjectAddButton organizationId={organizationId} />
        </div>

        {/* Search + table panel */}
        <div className="rounded-md border border-border bg-card">
          {/* Search bar */}
          <div className="border-b border-border px-4 py-3">
            <input
              type="search"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(
                'w-full max-w-sm rounded-md border border-input bg-background px-3 py-1.5 text-sm',
                'text-foreground placeholder:text-muted-foreground',
                'outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
              )}
            />
          </div>

          {/* Table header */}
          <div className="hidden grid-cols-[1fr_auto] px-4 py-2 md:grid">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              &nbsp;
            </span>
          </div>

          {/* Loading state */}
          {!initialProjects && (isLoading || isFetching) && (
            <div className="flex h-48 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          )}

          {/* Empty state */}
          {(initialProjects || (!isLoading && !isFetching)) && filtered.length === 0 && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>No projects found</span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs text-highlight hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Project rows */}
          {(initialProjects || (!isLoading && !isFetching)) && filtered.length > 0 && (
            <div>
              {filtered.map(project => (
                <ProjectRow key={project.id} project={project} showActions renderUrl={renderUrl} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
