'use client';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/components/hooks/useApi';
import { ProjectPage } from '@/app/(main)/[organizationId]/[projectId]/ProjectPage';
import { SharePage } from './SharePage';

export default function Share({
  params,
}: {
  params: Promise<{ shareId: string[] }>;
}) {
  const [shareId, setShareId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    params.then(p => {
      setShareId(p.shareId[0]);
    });
  }, [params]);

  useEffect(() => {
    if (shareId) {
      get(`/share/${shareId}`)
        .then((res: any) => {
          if (res && res.projectId) {
            setProjectId(res.projectId);
          } else {
            setProjectId(null);
          }
        })
        .catch(() => setProjectId(null))
        .finally(() => setLoading(false));
    }
  }, [shareId, get]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!projectId) {
    return notFound();
  }

  return (
    <SharePage projectId={projectId}>
      {/* We pass a dummy searchParams promise to ProjectPage */}
      <ProjectPage projectId={projectId} searchParams={Promise.resolve({})} />
    </SharePage>
  );
}
