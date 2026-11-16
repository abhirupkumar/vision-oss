'use client';

import { ArrowRight, TrendingDown, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FunnelStep } from './FunnelStepBuilder';

export interface FunnelResultItem {
  value: string;
  visitors: number;
  previous: number;
  dropped: number;
  dropoff: number;
  remaining: number;
}

const CHART_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(199, 89%, 48%)',
  'hsl(160, 84%, 39%)',
  'hsl(142, 76%, 36%)',
  'hsl(120, 61%, 50%)',
  'hsl(88, 50%, 53%)',
  'hsl(60, 80%, 50%)',
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{d.label}</p>
      <p className="text-muted-foreground">
        <span className="text-foreground font-medium">{d.visitors.toLocaleString()}</span> visitors
      </p>
      {d.index > 0 && (
        <p className="text-muted-foreground">
          <span className="text-destructive font-medium">−{d.dropped.toLocaleString()}</span>{' '}
          dropped ({(d.dropoff * 100).toFixed(1)}%)
        </p>
      )}
      <p className="text-muted-foreground">
        <span className="text-primary font-medium">{(d.remaining * 100).toFixed(1)}%</span> of total
      </p>
    </div>
  );
};

export function FunnelResults({ data, steps }: { data: FunnelResultItem[]; steps: FunnelStep[] }) {
  if (!data.length) return null;

  const totalVisitors = data[0]?.visitors ?? 0;
  const overallConversion =
    totalVisitors > 0 ? (data[data.length - 1]?.visitors ?? 0) / totalVisitors : 0;

  const chartData = data.map((item, index) => ({
    ...item,
    label: steps[index]?.value || item.value || `Step ${index + 1}`,
    index,
    visitors: Number(item.visitors),
    dropped: Number(item.dropped ?? 0),
    dropoff: Number(item.dropoff ?? 0),
    remaining: Number(item.remaining ?? 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={13} className="text-primary" />
            <span className="text-xs text-muted-foreground">Entered</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalVisitors.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight size={13} className="text-emerald-500" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {(data[data.length - 1]?.visitors ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={13} className="text-destructive" />
            <span className="text-xs text-muted-foreground">Dropped</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {(totalVisitors - (data[data.length - 1]?.visitors ?? 0)).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Conversion</span>
          </div>
          <p className="text-xl font-bold text-primary">{(overallConversion * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 16, right: 32, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={v => v.toLocaleString()}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
            />
            <Bar dataKey="visitors" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Step-by-step Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Visitors
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conversion
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Drop-off
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Drop %
              </th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((step, index) => (
              <tr
                key={step.value ?? index}
                className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="font-medium text-foreground">{step.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {step.visitors.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium text-primary">
                    {(step.remaining * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {index === 0 ? '—' : step.dropped.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {index === 0 ? (
                    '—'
                  ) : (
                    <span
                      className={
                        step.dropoff > 0.5
                          ? 'text-destructive font-medium'
                          : 'text-muted-foreground'
                      }
                    >
                      {(step.dropoff * 100).toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
