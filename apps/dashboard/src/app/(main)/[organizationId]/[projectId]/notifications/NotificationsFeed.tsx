'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/components/hooks';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Bell, AlertTriangle, Info, Zap } from 'lucide-react';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

interface NotificationItem {
  id: string;
  projectId: string;
  ruleId?: string;
  title: string;
  message: string;
  type: 'event' | 'anomaly' | string;
  severity: 'info' | 'warning' | 'critical' | string;
  source: string;
  isRead: boolean;
  payload?: string;
  createdAt: string;
}

export function NotificationsFeed({ projectId }: { projectId: string }) {
  const { get } = useApi();

  const { data, isLoading, isError, refetch } = useQuery<{ notifications: NotificationItem[] }>({
    queryKey: ['notifications-feed', projectId],
    queryFn: () => get(`/projects/${projectId}/notifications`),
    refetchInterval: 10000, // Poll every 10s for real-time notifications
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size={24} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-sm text-destructive">
        Failed to load notifications feed.{' '}
        <button onClick={() => refetch()} className="underline font-medium">
          Retry
        </button>
      </div>
    );
  }

  const notifications = data?.notifications || [];

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Bell size={36} className="mb-3 opacity-40" />
        <p className="text-base font-medium">No notifications yet</p>
        <p className="text-xs max-w-sm mt-1">
          When events match your notification rules or anomalies are detected, alerts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {notifications.map((item) => {
        const isAnomaly = item.type === 'anomaly';
        const severity = item.severity || 'info';

        return (
          <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
            <div className="shrink-0 mt-0.5">
              {isAnomaly ? (
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
                  <AlertTriangle size={18} />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Zap size={18} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{item.title}</span>
                {isAnomaly ? (
                  <Badge
                    variant={
                      severity === 'critical'
                        ? 'destructive'
                        : severity === 'warning'
                        ? 'outline'
                        : 'secondary'
                    }
                    className="capitalize text-[10px] px-1.5 py-0"
                  >
                    {severity} Anomaly
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Event
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ''}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {item.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
