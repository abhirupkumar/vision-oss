'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SessionProfile } from '@/app/(main)/[organizationId]/[projectId]/sessions/SessionProfile';
import { useNavigation } from '@/components/hooks';

export function SessionProfilePage({
  projectId,
  sessionId,
}: {
  projectId: string;
  sessionId: string;
}) {
  const { renderUrl } = useNavigation();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1320px] mx-auto w-full h-full overflow-auto">
      {/* Back link */}
      <Link
        href={renderUrl(`/${projectId}/sessions`, false)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        <span>Back to Sessions</span>
      </Link>

      <SessionProfile projectId={projectId} sessionId={sessionId} />
    </div>
  );
}
