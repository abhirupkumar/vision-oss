'use client';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import {
  useLoginQuery,
  useMessages,
  useProjectQuery,
  useUserProjectsQuery,
} from '@/components/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';

export function ProjectSelect({
  projectId,
  organizationId,
  onChange,
  ...props
}: {
  projectId?: string;
  organizationId?: string;
  onChange?: (id: string) => void;
  [key: string]: any;
}) {
  const { formatMessage, messages, labels } = useMessages();
  const { data: project } = useProjectQuery(projectId);
  const [search, setSearch] = useState('');
  const { user } = useLoginQuery();
  const { data, isLoading } = useUserProjectsQuery(
    { userId: user?.id, organizationId },
    { search, pageSize: 20 },
  );

  const projects: { id: string; name: string; slug?: string }[] = data?.data || [];
  const currentProject = project || projects.find(p => p.id === projectId || p.slug === projectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-border bg-card p-2 hover:bg-def-200 transition-colors outline-none focus:ring-2 focus:ring-ring/30',
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary shadow-sm text-[10px] font-bold">
              {currentProject?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <span className="truncate text-sm font-medium">
              {currentProject?.name || formatMessage(labels.selectProject)}
            </span>
          </div>
          <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="flex items-center gap-2 px-2 pb-2 pt-1">
          <Search size={14} className="text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={formatMessage(labels.search)}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Projects</DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[300px] overflow-auto hide-scrollbar">
          {isLoading && (
            <div className="flex py-4 justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          )}
          {!isLoading && projects.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {formatMessage(messages.noResultsFound)}
            </div>
          )}
          {projects.map(p => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => onChange?.(p.slug || p.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{p.name}</span>
              </div>
              {(p.id === projectId || p.slug === projectId) && <Check size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
