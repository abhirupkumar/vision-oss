'use client';
import { BarChart3, Globe, Menu, Settings, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLoginQuery, useMessages, useNavigation } from '@/components/hooks';
import { cn } from '@/lib/cn';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { formatMessage, labels } = useMessages();
  const { pathname, renderUrl } = useNavigation();
  const { user } = useLoginQuery();

  const links = [
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

  return (
    <>
      {/* Backdrop */}
      <button
        className={cn(
          'fixed inset-0 z-40 backdrop-blur-sm transition-opacity',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        type="button"
        aria-label="Close menu"
      />

      {/* Mobile Sidebar drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-border bg-card transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-72',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
          <Link href="/projects" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border p-1">
              <img src="/logo-black.png" className="w-full h-full object-contain block dark:hidden" alt="Vision Logo" />
              <img src="/logo-white.png" className="w-full h-full object-contain hidden dark:block" alt="Vision Logo" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Vision</span>
          </Link>
        </div>

        <div className="hide-scrollbar flex-1 overflow-auto p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">
            Navigation
          </div>
          <nav className="space-y-0.5">
            {links.map(({ id, path, label, icon }) => {
              const href = renderUrl(path, false);
              const isActive = path === '' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 font-medium text-[13px] transition-all hover:bg-def-200 text-foreground',
                    isActive ? 'bg-def-200' : '',
                  )}
                >
                  <span className="h-5 w-5 shrink-0 flex items-center justify-center">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {user?.role === 'admin' && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">
                Admin
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/admin/users"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-[13px] text-muted-foreground transition-all hover:bg-def-200"
                >
                  <Users size={16} />
                  <span>Users</span>
                </Link>
                <Link
                  href="/settings/preferences"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-[13px] text-muted-foreground transition-all hover:bg-def-200"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          )}
        </div>

        {user && (
          <div className="border-t border-border">
            <Link
              href={renderUrl('/settings/profile')}
              onClick={() => setOpen(false)}
              className="flex h-12 items-center gap-3 px-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="font-medium">{user.email}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Hamburger button (rendered in topbar) */}
      <button
        onClick={() => setOpen(p => !p)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent"
        type="button"
        aria-label="Toggle menu"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </button>
    </>
  );
}
