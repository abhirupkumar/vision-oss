'use client';
import {
  BarChart3,
  Globe,
  Plus,
  Settings,
  CreditCard,
  Terminal,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLoginQuery } from '@/components/hooks/queries/useLoginQuery';
import { useMessages } from '@/components/hooks/useMessages';
import { useNavigation } from '@/components/hooks/useNavigation';
import { cn } from '@/lib/cn';
import { OrgSwitcher } from './OrgSwitcher';
import { BillingAlertIcon } from '@/components/billing/BillingAlertIcon';
import { HAS_BILLING } from '@/lib/features';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
  isCollapsed?: boolean;
}

function NavLink({ href, icon, label, exact = true, isCollapsed = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 font-medium text-[13px] transition-all hover:bg-def-200 text-foreground',
        isActive && 'bg-def-200',
        isCollapsed && 'justify-center px-0',
      )}
    >
      <span className="h-5 w-5 shrink-0 flex items-center justify-center">{icon}</span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

import { UserButton, useUser } from '@clerk/nextjs';

export function SideNav() {
  const { pathname, renderUrl } = useNavigation();
  const { formatMessage, labels } = useMessages();
  const { user: clerkUser } = useUser();
  const { user } = useLoginQuery(); // Keep this for now if it's used for role checks

  const isInProject = pathname.includes('/projects/') && !pathname.endsWith('/projects');

  const mainLinks = [
    {
      id: 'projects',
      label: formatMessage(labels.projects),
      path: '',
      icon: <Globe size={16} />,
    },
    {
      id: 'members',
      label: formatMessage(labels.members),
      path: '/members',
      icon: <Users size={16} />,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      path: '/integrations',
      icon: <Globe size={16} />,
    },
  ];

  const isCollapsed = isInProject;

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[68px]' : 'w-[288px]',
      )}
    >
      {/* Brand & Org Switcher Header */}
      <div className="flex flex-col shrink-0 border-b border-border">
        <div
          className={cn(
            'flex h-12 items-center gap-2.5 px-4 pt-2',
            isCollapsed && 'justify-center px-2',
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border p-1 group-hover:border-foreground/30 transition-colors">
              <img src="/logo-black.png" className="w-full h-full object-contain block dark:hidden" alt="Vision" />
              <img src="/logo-white.png" className="w-full h-full object-contain hidden dark:block" alt="Vision" />
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-sm tracking-tight text-foreground">Vision</span>
            )}
          </Link>
        </div>
        <div className={cn('px-3 pb-3 pt-1', isCollapsed && 'px-2 pb-2')}>
          <OrgSwitcher isCollapsed={isCollapsed} />
        </div>
      </div>

      {/* Navigation */}
      <div className="hide-scrollbar flex-1 overflow-auto p-4">
        {/* Main navigation section */}
        <div className="mb-4">
          {!isCollapsed && (
            <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Navigation
            </div>
          )}
          <nav className="space-y-0.5">
            {mainLinks.map(({ id, path, label, icon }) => (
              <NavLink
                key={id}
                href={renderUrl(path, false)}
                icon={icon}
                label={label}
                exact={path === ''}
                isCollapsed={isCollapsed}
              />
            ))}
            {HAS_BILLING && (
              <NavLink
                href="/settings/billing"
                icon={<CreditCard size={16} />}
                label="Billing & Usage"
                exact={false}
                isCollapsed={isCollapsed}
              />
            )}
            <NavLink
              href={renderUrl('/settings', false)}
              icon={<Settings size={16} />}
              label={formatMessage(labels.settings)}
              exact={false}
              isCollapsed={isCollapsed}
            />
          </nav>
        </div>

        {/* Admin section — only visible to admins */}
        {user?.role === 'admin' && (
          <div className="mb-4">
            {!isCollapsed && (
              <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Admin
              </div>
            )}
            <nav className="space-y-0.5">
              <NavLink
                href="/admin/users"
                icon={<Users size={16} />}
                label="Users"
                exact={false}
                isCollapsed={isCollapsed}
              />
              <NavLink
                href="/admin/organizations"
                icon={<Globe size={16} />}
                label="Organizations"
                exact={false}
                isCollapsed={isCollapsed}
              />
              <NavLink
                href={renderUrl('/settings/preferences', false)}
                icon={<Settings size={16} />}
                label="Settings"
                exact={false}
                isCollapsed={isCollapsed}
              />
            </nav>
          </div>
        )}
      </div>

      {/* Persistent Billing Alert & Status Widget */}
      {HAS_BILLING && (
        <div className={cn('px-3 pb-3', isCollapsed && 'px-2')}>
          <BillingAlertIcon variant="sidebar" isCollapsed={isCollapsed} />
        </div>
      )}

      {/* Footer with Clerk UserButton */}
      <div className="border-t border-border bg-card p-4">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-8 h-8',
                userButtonTrigger: 'focus:shadow-none focus:ring-0',
              },
            }}
          />
          {!isCollapsed && clerkUser && (
            <div className="flex flex-col overflow-hidden text-xs">
              <span className="font-medium text-foreground truncate">
                {clerkUser.fullName ||
                  clerkUser.username ||
                  clerkUser.primaryEmailAddress?.emailAddress}
              </span>
              <span className="text-muted-foreground truncate">
                {clerkUser.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
