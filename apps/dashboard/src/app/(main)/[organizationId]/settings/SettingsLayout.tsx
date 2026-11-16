'use client';
import type { ReactNode } from 'react';
import { SettingsNav } from './SettingsNav';

export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-1">
      {/* Left settings nav — desktop only */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-4 lg:block">
        <SettingsNav />
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1060px] px-4 pb-8 pt-0 md:px-6">{children}</div>
      </div>
    </div>
  );
}
