'use client';
import { useMutation } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateDistance } from '@/components/common/DateDistance';
import { useApi } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NotificationRuleEditForm } from './NotificationRuleEditForm';

function TriggerLabel({ config }: { config: any }) {
  if (config?.trigger === 'event_received') {
    return (
      <span>
        When <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{config.eventName}</code> is
        tracked
      </span>
    );
  }
  return <span>Every tracked event</span>;
}

function ChannelBadges({ rule }: { rule: any }) {
  const channels: string[] = [];
  (rule.integrations ?? []).forEach((i: any) => {
    const type = i.config?.type;
    if (type && !channels.includes(type)) channels.push(type);
  });
  if (rule.sendToApp) channels.push('in-app');
  if (!channels.length) return <span className="text-muted-foreground text-xs">None</span>;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {channels.map(c => (
        <span
          key={c}
          className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium capitalize"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

export function NotificationRulesTable({
  data,
  projectId,
  onRefetch,
}: {
  data: any[];
  projectId: string;
  onRefetch: () => void;
}) {
  const { del } = useApi();
  const [editRule, setEditRule] = useState<any>(null);

  const { mutate: deleteRule } = useMutation({
    mutationFn: (ruleId: string) => del(`/projects/${projectId}/notification-rules/${ruleId}`, {}),
    onSuccess: () => {
      toast.success('Rule deleted');
      onRefetch();
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">🔔</div>
        <p className="text-muted-foreground text-sm">
          No notification rules yet. Add one to start receiving alerts.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Trigger</TableHead>
              <TableHead className="font-bold">Channels</TableHead>
              <TableHead className="font-bold">Created</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((rule: any) => (
              <TableRow key={rule.id} className="group">
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <TriggerLabel config={rule.config} />
                </TableCell>
                <TableCell>
                  <ChannelBadges rule={rule} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <DateDistance date={new Date(rule.createdAt)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" onClick={() => setEditRule(rule)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${rule.name}"?`)) deleteRule(rule.id);
                      }}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editRule} onOpenChange={open => !open && setEditRule(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Notification Rule</DialogTitle>
          </DialogHeader>
          {editRule && (
            <NotificationRuleEditForm
              projectId={projectId}
              rule={editRule}
              onSave={() => {
                onRefetch();
                setEditRule(null);
              }}
              onClose={() => setEditRule(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
