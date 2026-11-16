'use client';
import { ArrowRight } from 'lucide-react';
import type { Key } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  useConfig,
  useLoginQuery,
  useMessages,
  useMobile,
  useNavigation,
} from '@/components/hooks';
import {
  BookText,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Settings,
  User,
  Users,
} from '@/components/icons';
import { Switch } from '@/components/svg';
import { cn } from '@/lib/cn';
import { DOCS_URL, LAST_ORGANIZATION_CONFIG } from '@/lib/constants';
import { removeItem } from '@/lib/storage';

export interface OrganizationsButtonProps {
  showText?: boolean;
  onAction?: (id: any) => void;
}

export function NavButton({ showText = true }: OrganizationsButtonProps) {
  const { user } = useLoginQuery();
  const { cloudMode } = useConfig();
  const { formatMessage, labels } = useMessages();
  const { organizationId, router } = useNavigation();
  const { isMobile } = useMobile();
  const organization = user?.organizations?.find(({ id }) => id === organizationId);
  const label = organizationId ? organization?.name : user.email;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const getUrl = (url: string) => {
    return cloudMode ? `${process.env.cloudUrl}${url}` : url;
  };

  const handleUserSwitch = () => {
    setOpen(false);
    removeItem(LAST_ORGANIZATION_CONFIG);
    if (cloudMode) {
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  const handleNav = (url: string) => {
    setOpen(false);
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else if (cloudMode) {
      window.location.href = url;
    } else {
      router.push(url);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center justify-between gap-2 rounded-md border border-border',
          'bg-background px-3 py-2 text-sm font-medium shadow-sm max-h-10',
          'hover:bg-accent transition-colors cursor-pointer',
          showText ? 'w-full' : 'w-10 justify-center',
        )}
        style={{ textWrap: 'nowrap', overflow: 'hidden', outline: 'none' }}
      >
        <span className="flex items-center gap-2">
          <span className="h-4 w-4">{organizationId ? <Users /> : <User />}</span>
          {showText && <span>{label}</span>}
        </span>
        {showText && (
          <span className="h-4 w-4 rotate-90">
            <ChevronRight />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-75 rounded-md border border-border bg-popover shadow-lg">
          {/* Switch account section */}
          <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
            {formatMessage(labels.myAccount)}
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
            onClick={handleUserSwitch}
          >
            <span className="h-4 w-4">
              <User />
            </span>
            {user.email}
          </button>

          {/* Organizations section */}
          {user?.organizations && user.organizations.length > 0 && (
            <>
              <div className="border-t border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                {formatMessage(labels.organizations)}
              </div>
              {user.organizations.map(({ id, name }) => (
                <a
                  key={id}
                  href={getUrl(`/organizations/${id}`)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent',
                    organizationId === id && 'font-bold bg-accent/50',
                  )}
                >
                  <span className="h-4 w-4">
                    <Users />
                  </span>
                  <span className="whitespace-nowrap">{name}</span>
                </a>
              ))}
            </>
          )}
          {user?.organizations?.length === 0 && (
            <a
              href="/settings/organizations"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-accent"
            >
              <span>Manage organizations</span>
              <span className="h-4 w-4">
                <ArrowRight size={16} />
              </span>
            </a>
          )}

          {/* Main nav */}
          <div className="border-t border-border my-1" />
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
            onClick={() => handleNav(getUrl('/settings'))}
          >
            <span className="h-4 w-4">
              <Settings />
            </span>
            {formatMessage(labels.settings)}
          </button>
          {cloudMode && (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                onClick={() => handleNav(DOCS_URL)}
              >
                <span className="h-4 w-4">
                  <BookText />
                </span>
                <span className="flex-1">{formatMessage(labels.documentation)}</span>
                <span className="h-3 w-3 text-muted-foreground">
                  <ExternalLink />
                </span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                onClick={() => handleNav(getUrl('/settings/support'))}
              >
                <span className="h-4 w-4">
                  <LifeBuoy />
                </span>
                {formatMessage(labels.support)}
              </button>
            </>
          )}
          {!cloudMode && user.isAdmin && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
              onClick={() => handleNav('/admin')}
            >
              <span className="h-4 w-4">
                <LockKeyhole />
              </span>
              {formatMessage(labels.admin)}
            </button>
          )}
          <div className="border-t border-border my-1" />
          <a
            href={getUrl('/logout')}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <span className="h-4 w-4">
              <LogOut />
            </span>
            {formatMessage(labels.logout)}
          </a>
        </div>
      )}
    </div>
  );
}
