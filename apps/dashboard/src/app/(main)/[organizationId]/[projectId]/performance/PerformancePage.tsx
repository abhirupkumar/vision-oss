'use client';

import { colord } from 'colord';
import { useMemo, useState } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { BarChart } from '@/components/charts/BarChart';
import { Panel } from '@/components/common/Panel';
import { useDateParameters, useLocale, usePerformanceQuery } from '@/components/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { renderDateLabels } from '@/lib/charts';
import { CHART_COLORS } from '@/lib/constants';
import { formatLongNumber } from '@/lib/format';

const METRICS = ['lcp', 'inp', 'cls', 'fcp', 'ttfb'] as const;

const METRIC_LABELS: Record<string, string> = {
  lcp: 'Largest Contentful Paint',
  inp: 'Interaction to Next Paint',
  cls: 'Cumulative Layout Shift',
  fcp: 'First Contentful Paint',
  ttfb: 'Time to First Byte',
};

function formatMetricValue(metric: string, value: number): string {
  if (metric === 'cls') return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

const PERCENTILES = [
  { id: 'p50', label: 'p50 — Median' },
  { id: 'p75', label: 'p75 — 75th Percentile' },
  { id: 'p95', label: 'p95 — 95th Percentile' },
] as const;

export function PerformancePage({ projectId }: { projectId: string }) {
  const [selectedMetric, setSelectedMetric] = useState<string>('lcp');
  const [selectedPercentile, setSelectedPercentile] = useState<'p50' | 'p75' | 'p95'>('p75');
  const { locale, dateLocale } = useLocale();
  const { unit } = useDateParameters();

  const { data, isLoading } = usePerformanceQuery(projectId, selectedMetric);

  const chartData: any = useMemo(() => {
    if (!data?.chart) return { datasets: [] };

    const p50Color = colord(CHART_COLORS[0]).darken(0.15);
    const p75Color = colord(CHART_COLORS[1]).darken(0.15);
    const p95Color = colord(CHART_COLORS[2]).darken(0.15);

    return {
      datasets: [
        {
          label: 'p50',
          data: data.chart.map((d: any) => ({ x: d.t, y: Number(d.p50) })),
          type: 'line',
          borderColor: p50Color.alpha(1).toRgbString(),
          backgroundColor: p50Color.alpha(0.3).toRgbString(),
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'p75',
          data: data.chart.map((d: any) => ({ x: d.t, y: Number(d.p75) })),
          type: 'line',
          borderColor: p75Color.alpha(1).toRgbString(),
          backgroundColor: p75Color.alpha(0.3).toRgbString(),
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'p95',
          data: data.chart.map((d: any) => ({ x: d.t, y: Number(d.p95) })),
          type: 'line',
          borderColor: p95Color.alpha(1).toRgbString(),
          backgroundColor: p95Color.alpha(0.3).toRgbString(),
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    };
  }, [data]);

  const renderXLabel = renderDateLabels(unit, locale);

  const isCls = selectedMetric === 'cls';

  const formatListCount = isCls
    ? (n: number) => n.toFixed(3)
    : (n: number) => `${(n / 1000).toFixed(2)} s`;

  const renderTable = (items: any[]) => {
    if (!items || items.length === 0) {
      return <div className="text-sm text-muted-foreground p-4 text-center">No data available</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => {
            const val = Number({ p50: item.p50, p75: item.p75, p95: item.p95 }[selectedPercentile]);
            if (val === 0) return null;
            return (
              <TableRow key={i}>
                <TableCell className="font-medium truncate max-w-[300px]" title={item.name}>
                  {item.name || '(Unknown)'}
                </TableCell>
                <TableCell className="text-right">{formatListCount(val)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} />

      <div className="flex items-center w-[280px]">
        <Select
          value={selectedPercentile}
          onValueChange={(value: any) => setSelectedPercentile(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Percentile" />
          </SelectTrigger>
          <SelectContent>
            {PERCENTILES.map(({ id, label }) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {METRICS.map(metric => {
          const value = Number(data?.summary?.[metric]?.[selectedPercentile] || 0);
          const isSelected = selectedMetric === metric;

          return (
            <Card
              key={metric}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedMetric(metric)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                  {metric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : formatMetricValue(metric, value)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Panel>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">{METRIC_LABELS[selectedMetric]}</h3>
            <div className="text-sm text-muted-foreground">
              Sample Size: {formatLongNumber(data?.summary?.count || 0)}
            </div>
          </div>

          <div className="h-[400px] w-full">
            {!isLoading && data?.chart && (
              <BarChart
                chartData={chartData}
                renderXLabel={renderXLabel}
                renderYLabel={(label: string) => {
                  const val = Number(label);
                  if (selectedMetric === 'cls') return val.toFixed(2);
                  if (val >= 1000) return `${(val / 1000).toFixed(2)} s`;
                  return `${Math.round(val)} ms`;
                }}
              />
            )}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-4">Pages</h3>
            <Tabs defaultValue="path">
              <TabsList className="mb-4">
                <TabsTrigger value="path">Path</TabsTrigger>
                <TabsTrigger value="title">Page Title</TabsTrigger>
              </TabsList>
              <TabsContent value="path">{renderTable(data?.pages?.slice(0, 20))}</TabsContent>
              <TabsContent value="title">{renderTable(data?.pageTitles?.slice(0, 20))}</TabsContent>
            </Tabs>
          </div>
        </Panel>

        <Panel>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-4">Environment</h3>
            <Tabs defaultValue="device">
              <TabsList className="mb-4">
                <TabsTrigger value="device">Device</TabsTrigger>
                <TabsTrigger value="browser">Browser</TabsTrigger>
              </TabsList>
              <TabsContent value="device">{renderTable(data?.devices?.slice(0, 20))}</TabsContent>
              <TabsContent value="browser">{renderTable(data?.browsers?.slice(0, 20))}</TabsContent>
            </Tabs>
          </div>
        </Panel>
      </div>
    </div>
  );
}
