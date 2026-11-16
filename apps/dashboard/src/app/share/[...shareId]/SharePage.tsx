'use client';
import { useEffect } from 'react';
import { ProjectHeader } from '@/app/(main)/[organizationId]/[projectId]/ProjectHeader';
import { ProjectProvider } from '@/app/(main)/[organizationId]/ProjectProvider';
import { PageBody } from '@/components/common/PageBody';
import { useTheme } from '@/components/hooks';
import { Footer } from './Footer';
import { Header } from './Header';

export function SharePage({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const url = new URL(window?.location?.href);
    const theme = url.searchParams.get('theme');

    if (theme === 'light' || theme === 'dark') {
      setTheme(theme);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageBody>
        <Header />
        <ProjectProvider projectId={projectId}>
          <ProjectHeader showActions={false} />
          {children}
        </ProjectProvider>
        <Footer />
      </PageBody>
    </div>
  );
}
