'use client';

import * as React from 'react';
import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export interface PieChartProps {
  type?: 'doughnut' | 'pie';
  chartData?: any;
}

export function PieChart({ type = 'pie', chartData }: PieChartProps) {
  const transformedData = React.useMemo(() => {
    if (!chartData?.labels || !chartData?.datasets?.[0]) return [];

    return chartData.labels.map((label: string, index: number) => ({
      name: label,
      value: chartData.datasets[0].data[index],
      fill: chartData.datasets[0].backgroundColor?.[index] || 'var(--color-primary)',
    }));
  }, [chartData]);

  const config = React.useMemo(() => {
    const cfg: ChartConfig = {};
    transformedData.forEach((item: any) => {
      cfg[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    return cfg;
  }, [transformedData]);

  if (transformedData.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ChartContainer config={config} className="aspect-square w-full h-full">
        <RechartsPieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={transformedData}
            dataKey="value"
            nameKey="name"
            innerRadius={type === 'doughnut' ? '65%' : 0}
            outerRadius="95%"
            strokeWidth={4}
            stroke="var(--background)"
            paddingAngle={1}
          >
            {transformedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="flex-wrap gap-x-4 gap-y-2 pt-6"
          />
        </RechartsPieChart>
      </ChartContainer>
    </div>
  );
}
