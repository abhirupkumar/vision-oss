'use client';
import { useEffect, useRef, useState } from 'react';
import { useConfig, useLoginQuery, useMessages, useNavigation } from '@/components/hooks';
import {
  BookText,
  ExternalLink,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Settings,
  UserCircle,
} from '@/components/icons';
import { cn } from '@/lib/cn';
import { DOCS_URL } from '@/lib/constants';

export function SettingsButton() {
  const { formatMessage, labels } = useMessages();
  const { user } = useLoginQuery();
  const { router } = useNavigation();
  const { cloudMode } = useConfig();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAction = (url: string) => {
    setOpen(false);
    if (cloudMode) {
      if (url === '/docs') {
        window.open(DOCS_URL, '_blank');
      } else {
        window.location.href = url;
      }
    } else {
      router.push(url);
    }
  };

  const menuItems = [
    {
      id: '/settings',
      icon: <Settings />,
      label: formatMessage(labels.settings),
    },
    !cloudMode &&
      user.isAdmin && {
        id: '/admin',
        icon: <LockKeyhole />,
        label: formatMessage(labels.admin),
      },
    cloudMode && {
      id: '/docs',
      icon: <BookText />,
      label: formatMessage(labels.documentation),
      suffix: <ExternalLink />,
    },
    cloudMode && {
      id: '/settings/support',
      icon: <LifeBuoy />,
      label: formatMessage(labels.support),
    },
    { separator: true },
    {
      id: '/logout',
      icon: <LogOut />,
      label: formatMessage(labels.logout),
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
        <div className="absolute right-0 top-full z-50 mt-1 min-w-45 rounded-md border border-border bg-popover shadow-lg">
          <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
            {user.email}
          </div>
          {menuItems.map((item: any, i) => {
            if (item.separator) {
              return <div key={i} className="border-t border-border my-1" />;
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAction(item.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <span className="h-4 w-4 text-muted-foreground">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.suffix && (
                  <span className="h-3 w-3 text-muted-foreground">{item.suffix}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
