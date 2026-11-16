import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/components/hooks';
import { cn } from '@/lib/cn';
import { REPO_URL, VERSION_CHECK } from '@/lib/constants';
import { setItem } from '@/lib/storage';
import { checkVersion, useVersion } from '@/store/version';

export function UpdateNotice({ user, config }) {
  const { formatMessage, labels, messages } = useMessages();
  const { latest, checked, hasUpdate, releaseUrl } = useVersion();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(checked);

  const allowUpdate =
    process.env.NODE_ENV === 'production' &&
    user?.isAdmin &&
    !config?.updatesDisabled &&
    !config?.privateMode &&
    !pathname.includes('/share/') &&
    !process.env.cloudMode &&
    !dismissed;

  const updateCheck = useCallback(() => {
    setItem(VERSION_CHECK, { version: latest, time: Date.now() });
  }, [latest]);

  function handleViewClick() {
    updateCheck();
    setDismissed(true);
    open(releaseUrl || REPO_URL, '_blank');
  }

  function handleDismissClick() {
    updateCheck();
    setDismissed(true);
  }

  useEffect(() => {
    if (allowUpdate) {
      checkVersion();
    }
  }, [allowUpdate]);

  if (!allowUpdate || !hasUpdate) {
    return null;
  }

  return (
    <div className="fixed top-2.5 left-0 z-50 flex w-full items-center justify-center">
      <div className="flex w-[600px] items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 shadow-lg">
        <span className="text-sm text-amber-700 dark:text-amber-300">
          {formatMessage(messages.newVersionAvailable, { version: `v${latest}` })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleViewClick}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {formatMessage(labels.viewDetails)}
          </button>
          <button
            type="button"
            onClick={handleDismissClick}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {formatMessage(labels.dismiss)}
          </button>
        </div>
      </div>
    </div>
  );
}
