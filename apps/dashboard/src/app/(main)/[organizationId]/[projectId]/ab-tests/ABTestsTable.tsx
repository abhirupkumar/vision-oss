'use client';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Play, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateDistance } from '@/components/common/DateDistance';
import { useApi } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ABTestDetail } from './ABTestDetail';
import { ABTestStatusBadge } from './ABTestStatusBadge';

export function ABTestsTable({
  data,
  projectId,
  onRefetch,
  onSelect,
  selected,
}: {
  data: any[];
  projectId: string;
  onRefetch: () => void;
  onSelect: (test: any) => void;
  selected: any;
}) {
  const { put, del } = useApi();

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ testId, status }: { testId: string; status: string }) =>
      put(`/projects/${projectId}/ab-tests/${testId}`, { status }),
    onSuccess: () => {
      toast.success('Test status updated');
      onRefetch();
    },
    onError: () => toast.error('Failed to update status'),
  });

  const { mutate: deleteTest } = useMutation({
    mutationFn: (testId: string) => del(`/projects/${projectId}/ab-tests/${testId}`, {}),
    onSuccess: () => {
      toast.success('Test deleted');
      onRefetch();
    },
    onError: () => toast.error('Failed to delete test'),
  });

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">🧪</div>
        <p className="text-muted-foreground text-sm">
          No A/B tests yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead className="font-bold">Name</TableHead>
            <TableHead className="font-bold">Goal Event</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold">Variants</TableHead>
            <TableHead className="font-bold">Created</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((test: any) => (
            <>
              <TableRow
                key={test.id}
                className="group cursor-pointer"
                onClick={() => onSelect(selected?.id === test.id ? null : test)}
              >
                <TableCell>
                  {selected?.id === test.id ? (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{test.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {test.goalEventName}
                  </code>
                </TableCell>
                <TableCell>
                  <ABTestStatusBadge status={test.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {test._count?.sessions ?? 0} sessions
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <DateDistance date={new Date(test.createdAt)} />
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                  >
                    {test.status === 'draft' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Start"
                        onClick={() => updateStatus({ testId: test.id, status: 'running' })}
                      >
                        <Play size={14} className="text-green-500" />
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Stop"
                        onClick={() => updateStatus({ testId: test.id, status: 'stopped' })}
                      >
                        <Square size={14} className="text-orange-500" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${test.name}"?`)) deleteTest(test.id);
                      }}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {selected?.id === test.id && (
                <TableRow key={`${test.id}-detail`}>
                  <TableCell colSpan={7} className="bg-muted/30 p-0">
                    <ABTestDetail testId={test.id} projectId={projectId} />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
