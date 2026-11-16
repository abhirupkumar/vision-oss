'use client';

import { Check, ChevronsUpDown, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLoginQuery } from '@/components/hooks/queries/useLoginQuery';
import { useNavigation } from '@/components/hooks/useNavigation';
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

export function OrgSwitcher({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user } = useLoginQuery();
  const { organizationId, router } = useNavigation();

  const organizations = user?.organizations || [];
  const currentOrg =
    organizations.find((org: any) => org.id === organizationId) || organizations[0];

  if (!currentOrg) return null;

  const handleSelect = (org: any) => {
    router.push(`/${org.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center justify-between rounded-md p-2 hover:bg-def-200 transition-colors border border-border bg-card',
            isCollapsed && 'justify-center',
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-950 text-white shadow-sm text-xs font-bold">
              {currentOrg.name.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <span className="truncate text-sm font-medium">{currentOrg.name}</span>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {organizations.map((org: any) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSelect(org)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{org.name}</span>
              </div>
              {org.id === currentOrg.id && <Check size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/onboarding')} className="gap-2">
          <Plus size={14} />
          <span>Create Organization</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/${currentOrg.id}/settings`)}
          className="gap-2"
        >
          <Settings size={14} />
          <span>Organization Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
