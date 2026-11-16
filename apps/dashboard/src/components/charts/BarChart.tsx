'use client';

import * as React from 'react';
import { Bar, CartesianGrid, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatLongCurrency, formatLongNumber } from '@/lib/format';

export interface BarChartProps {
  chartData?: any;
  unit?: string;
  stacked?: boolean;
  currency?: string;
  renderXLabel?: (label: string, index: number, values: any[]) => string;
  renderYLabel?: (label: string, index: number, values: any[]) => string;
  height?: string | number;
}

export function BarChart({
  chartData,
  unit,
  stacked = false,
  currency,
  renderXLabel,
  renderYLabel,
  height = 400,
}: BarChartProps) {
  const transformedData = React.useMemo(() => {
    if (!chartData?.datasets?.[0]?.data) return [];

    const datasets = chartData.datasets;
    const firstDataset = datasets[0];

    return firstDataset.data.map((point: any, i: number) => {
      const item: any = {
        x: point.x,
        value: point.x, // For renderDateLabels compatibility
        index: i,
      };
      datasets.forEach((ds: any) => {
        // Use label as key, but sanitize it for safety
        const key = ds.label || 'value';
        item[key] = ds.data[i]?.y ?? 0;
      });
      return item;
    });
  }, [chartData]);

  const config = React.useMemo(() => {
    const cfg: ChartConfig = {};
    chartData?.datasets?.forEach((ds: any) => {
      const key = ds.label || 'value';
      cfg[key] = {
        label: ds.label,
        color: ds.backgroundColor || ds.borderColor || 'var(--color-primary)',
      };
    });
    return cfg;
  }, [chartData]);

  const yKeys = React.useMemo(() => {
    return chartData?.datasets?.map((ds: any) => ds.label || 'value') || [];
  }, [chartData]);

  if (transformedData.length === 0) return null;

  const defaultYFormatter = (value: any) => {
    if (currency) return formatLongCurrency(value, currency);
    return formatLongNumber(value);
  };

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <RechartsBarChart
        data={transformedData}
        margin={{
          top: 20,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
        <XAxis
          dataKey="x"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={32}
          tickFormatter={(value, index) =>
            renderXLabel?.(value, index, transformedData) ?? String(value)
          }
          className="text-[11px] font-medium"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value, index) =>
            renderYLabel?.(value, index, transformedData) ?? defaultYFormatter(value)
          }
          className="text-[11px] font-medium"
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) => {
                const index = payload?.[0]?.payload?.index;
                return renderXLabel?.(value, index, transformedData) ?? String(value);
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-x-4 gap-y-2 pt-6" />
        {yKeys.map(key => (
          <Bar
            key={key}
            dataKey={key}
            fill={config[key]?.color ?? `var(--color-${key})`}
            stackId={stacked ? 'a' : undefined}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}
