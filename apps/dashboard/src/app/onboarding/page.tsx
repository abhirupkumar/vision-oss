'use client';

import { MobileNav } from '@/app/(main)/MobileNav';
import { SideNav } from '@/app/(main)/SideNav';
import { CreateProjectModal } from '@/components/common/CreateProjectModal';

export default function OnboardingPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Fake Sidebar background */}
      <aside className="hidden lg:flex pointer-events-none opacity-40 grayscale blur-[2px]">
        <SideNav />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Fake MobileNav background */}
        <div className="flex items-center border-b border-border bg-card px-4 py-3 lg:hidden pointer-events-none opacity-40 grayscale blur-[2px]">
          <MobileNav />
        </div>

        <main className="flex-1 relative flex flex-col overflow-hidden bg-background/50">
          {/* Faded dummy content */}
          <div className="absolute inset-0 p-8 opacity-20 pointer-events-none blur-[4px]">
            <div className="h-10 w-64 bg-zinc-300 dark:bg-zinc-700 rounded-lg mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            </div>
            <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          </div>

          {/* Wizard overlay */}
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <CreateProjectModal mode="workspace" isCancellable={false} />
          </div>
        </main>
      </div>
    </div>
  );
}
