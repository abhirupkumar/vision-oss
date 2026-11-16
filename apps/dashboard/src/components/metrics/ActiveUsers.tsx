import { useMemo } from 'react';
import { LinkButton } from '@/components/common/LinkButton';
import { useActyiveUsersQuery, useMessages } from '@/components/hooks';

export function ActiveUsers({
  projectId,
  value,
  refetchInterval = 60000,
}: {
  projectId: string;
  value?: number;
  refetchInterval?: number;
}) {
  const { formatMessage, labels } = useMessages();
  const { data } = useActyiveUsersQuery(projectId, { refetchInterval });

  const count = useMemo(() => {
    if (projectId) {
      return data?.visitors || 0;
    }

    return value !== undefined ? value : 0;
  }, [data, value, projectId]);

  if (count === 0) {
    return null;
  }

  return (
    <LinkButton href={`/projects/${projectId}/realtime`} variant="ghost">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        {count} {formatMessage(labels.online)}
      </span>
    </LinkButton>
  );
}
