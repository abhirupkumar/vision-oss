'use client';

import { Bug, Users, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectErrorSummaryQuery } from '@/components/hooks';
import { useProject } from '@/components/hooks';
import { LoadingPanel } from '@/components/common/LoadingPanel';

export function ErrorSummaryStats() {
  const { projectId } = useProject();
  const { data, isLoading } = useProjectErrorSummaryQuery(projectId);

  if (isLoading) {
    return <LoadingPanel isLoading={isLoading} minHeight="200px"><div></div></LoadingPanel>;
  }

  const stats = data || {
    totalErrors: 0,
    uniqueErrorTypes: 0,
    affectedUsers: 0,
    errorRate: 0
  };

  const cards = [
    {
      title: 'Total Errors',
      value: stats.totalErrors.toLocaleString(),
      icon: <Bug className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Unique Issues',
      value: stats.uniqueErrorTypes.toLocaleString(),
      icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Affected Users',
      value: stats.affectedUsers.toLocaleString(),
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Error Rate',
      value: `${stats.errorRate.toFixed(2)}%`,
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
