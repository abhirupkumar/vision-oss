'use client';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/components/hooks';
import { NotificationRuleCreateButton } from './NotificationRuleCreateButton';
import { NotificationRulesTable } from './NotificationRulesTable';

export function NotificationRulesDataTable({ projectId }: { projectId: string }) {
  const { get } = useApi();

  const { data, refetch } = useQuery({
    queryKey: ['notification-rules', projectId],
    queryFn: () => get(`/projects/${projectId}/notification-rules`),
    enabled: !!projectId,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Notification Rules</h3>
          <p className="text-sm text-muted-foreground">
            Define rules to alert your team via Slack or Discord when specific events occur.
          </p>
        </div>
        <NotificationRuleCreateButton projectId={projectId} onSave={refetch} />
      </div>
      <NotificationRulesTable data={data ?? []} projectId={projectId} onRefetch={refetch} />
    </div>
  );
}
