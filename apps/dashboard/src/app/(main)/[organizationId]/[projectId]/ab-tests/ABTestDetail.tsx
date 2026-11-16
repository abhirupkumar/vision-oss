'use client';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/components/hooks';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ABTestDetail({ testId, projectId }: { testId: string; projectId: string }) {
  const { get } = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ['ab-test-detail', testId],
    queryFn: () => get(`/projects/${projectId}/ab-tests/${testId}`),
    enabled: !!testId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  const variantStats: any[] = data.variantStats ?? [];
  const winner = variantStats.reduce(
    (best: any, v: any) => (!best || v.conversionRate > best.conversionRate ? v : best),
    null,
  );

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="text-sm font-medium text-muted-foreground">Variant Performance</div>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold">Variant</TableHead>
              <TableHead className="font-bold text-right">Sessions</TableHead>
              <TableHead className="font-bold text-right">Conversions</TableHead>
              <TableHead className="font-bold text-right">Conversion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variantStats.map((variant: any) => (
              <TableRow key={variant.id}>
                <TableCell className="font-medium">
                  {variant.name}
                  {winner?.id === variant.id &&
                    variantStats.length > 1 &&
                    variant.conversions > 0 && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                        🏆 winner
                      </span>
                    )}
                </TableCell>
                <TableCell className="text-right">{variant.totalSessions}</TableCell>
                <TableCell className="text-right">{variant.conversions}</TableCell>
                <TableCell className="text-right">
                  <span className="font-mono">{variant.conversionRate.toFixed(2)}%</span>
                  <div className="mt-1 h-1.5 w-full max-w-[120px] ml-auto bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(variant.conversionRate, 100)}%` }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
