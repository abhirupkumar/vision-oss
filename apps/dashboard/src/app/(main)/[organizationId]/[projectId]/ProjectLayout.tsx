'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProjectProvider } from '@/app/(main)/[organizationId]/ProjectProvider';
import { ProjectHeader } from './ProjectHeader';
import { ProjectNav } from './ProjectNav';

export function ProjectLayout({
  projectId,
  initialProject,
  children,
}: {
  projectId: string;
  initialProject?: any;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // Pages that need full-height layout (no padding wrapper, no scroll on outer container)
  const isFullHeight = pathname?.includes('/nlq');

  return (
    <ProjectProvider projectId={projectId} initialProject={initialProject}>
        <div className="flex h-full w-full overflow-hidden">
        {/* Left project nav — desktop only (Dual Sidebar) */}
        <aside className="hidden shrink-0 bg-card lg:flex h-full">
          <ProjectNav projectId={projectId} />
        </aside>

        {/* Main content */}
        {isFullHeight ? (
          // Full-height layout: header pinned at top, content fills remaining space
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mx-auto w-full max-w-400 shrink-0 px-4 pt-0 md:px-6">
              <ProjectHeader showActions />
            </div>
            <div className="flex-1 overflow-hidden">{children}</div>
          </div>
        ) : (
          // Standard scrollable layout for all other pages
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-400 px-4 pb-8 pt-0 md:px-6">
              <ProjectHeader showActions />
              <div>{children}</div>
            </div>
          </div>
        )}
      </div>
    </ProjectProvider>
  );
}
