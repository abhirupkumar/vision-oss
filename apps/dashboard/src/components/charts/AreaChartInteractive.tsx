'use client';
import { TrendingUp } from 'lucide-react';
import type * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export interface AreaChartInteractiveProps {
  title?: string;
  description?: string;
  data: any[];
  config: ChartConfig;
  xKey: string;
  yKeys: string[];
  renderXLabel?: (value: any, index: number, values: any[]) => string;
  renderYLabel?: (value: any, index: number, values: any[]) => string;
  height?: string | number;
  footerTitle?: React.ReactNode;
  footerDescription?: React.ReactNode;
}

export function AreaChartInteractive({
  title,
  description,
  data,
  config,
  xKey,
  yKeys,
  renderXLabel,
  renderYLabel,
  height = 400,
  footerTitle,
  footerDescription,
}: AreaChartInteractiveProps) {
  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent w-full">
      {(title || description) && (
        <CardHeader className="px-0 pt-0">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="px-0">
        <ChartContainer config={config} className={`aspect-auto w-full`} style={{ height }}>
          <AreaChart
            data={data}
            margin={{
              left: 0,
              right: 0,
              top: 10,
              bottom: 0,
            }}
          >
            <defs>
              {yKeys.map(key => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value, index) => renderXLabel?.(value, index, data) ?? String(value)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value, index) => renderYLabel?.(value, index, data) ?? String(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    return (
                      renderXLabel?.(value, payload?.[0]?.payload?.index, data) ?? String(value)
                    );
                  }}
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {yKeys.map(key => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {(footerTitle || footerDescription) && (
        <CardFooter className="px-0 pt-3 pb-3 flex-col items-center justify-center">
          <div className="flex w-full items-center justify-center gap-2 text-sm text-center">
            <div className="grid gap-2 justify-items-center">
              {footerTitle && (
                <div className="flex items-center justify-center gap-2 leading-none font-medium">
                  {footerTitle}
                </div>
              )}
              {footerDescription && (
                <div className="flex items-center justify-center gap-2 leading-none text-muted-foreground">
                  {footerDescription}
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
