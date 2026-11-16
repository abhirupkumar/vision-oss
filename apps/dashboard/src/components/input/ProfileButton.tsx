'use client';
import { useClerk } from '@clerk/nextjs';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useLoginQuery, useMessages, useNavigation } from '@/components/hooks';
import { LockKeyhole, LogOut, UserCircle } from '@/components/icons';
import { setUser } from '@/store/app';

export function ProfileButton() {
  const { formatMessage, labels } = useMessages();
  const { user } = useLoginQuery();
  const { renderUrl } = useNavigation();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    setUser(null);
    signOut({ redirectUrl: `${process.env.basePath || ''}/sign-in` });
  };

  const items = [
    {
      id: 'settings',
      label: formatMessage(labels.profile),
      path: renderUrl('/settings/profile'),
      icon: <UserCircle />,
    },
    user.isAdmin &&
      !process.env.cloudMode && {
        id: 'admin',
        label: formatMessage(labels.admin),
        path: '/admin',
        icon: <LockKeyhole />,
      },
  ].filter(Boolean);

  return (
    <div ref={ref} className="relative">
      <button
        data-test="button-profile"
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className="h-5 w-5">
          <UserCircle />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border bg-popover shadow-lg">
          {/* User name header */}
          <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
            {user.email}
          </div>
          {items.map((item: any) => (
            <Fragment key={item.id}>
              <a
                href={item.path}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="h-4 w-4 text-muted-foreground">{item.icon}</span>
                {item.label}
              </a>
            </Fragment>
          ))}
          {/* Logout — calls Clerk signOut directly */}
          <div className="border-t border-border my-1" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="h-4 w-4 text-muted-foreground">
              <LogOut />
            </span>
            {formatMessage(labels.logout)}
          </button>
        </div>
      )}
    </div>
  );
}
