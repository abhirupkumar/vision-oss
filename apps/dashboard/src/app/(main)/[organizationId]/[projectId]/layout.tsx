import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectLayout } from './ProjectLayout';

export default async function ({
  children,
  params,
}: {
  children: any;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const reservedKeywords = [
    'settings',
    'preferences',
    'profile',
    'profiles',
    'members',
    'integrations',
    'links',
    'pixels',
    'boards',
    'console',
    'organizations',
  ];
  if (reservedKeywords.includes(projectId?.toLowerCase())) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <ProjectLayout projectId={projectId}>{children}</ProjectLayout>
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s | Vision',
    default: 'Projects | Vision',
  },
};
