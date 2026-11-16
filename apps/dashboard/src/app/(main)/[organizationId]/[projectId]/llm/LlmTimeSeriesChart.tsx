'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TimeSeriesPoint {
  date: string;
  totalCost: number;
  totalTokens: number;
  avgLatency: number;
  totalCalls: number;
  errorCount: number;
}

interface Props {
  data: TimeSeriesPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-mono font-medium" style={{ color: entry.color }}>
            {entry.name === 'Cost ($)' ? `$${Number(entry.value).toFixed(4)}` :
             entry.name === 'Avg Latency (ms)' ? `${Math.round(entry.value)}ms` :
             Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LlmCostChart({ data }: Props) {
  const chartData = useMemo(() =>
    data.map(d => ({ date: d.date.slice(5), cost: d.totalCost })),
    [data],
  );

  return (
    <div className="w-full [&_.recharts-cartesian-axis-tick_text]:!fill-muted-foreground">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={v => `$${v.toFixed(3)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cost"
            name="Cost ($)"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#costGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LlmTokenChart({ data }: Props) {
  const chartData = useMemo(() =>
    data.map(d => ({ date: d.date.slice(5), tokens: d.totalTokens, calls: d.totalCalls })),
    [data],
  );

  return (
    <div className="w-full [&_.recharts-cartesian-axis-tick_text]:!fill-muted-foreground [&_.recharts-legend-item-text]:!text-foreground">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--foreground)' }} />
          <Line
            type="monotone"
            dataKey="tokens"
            name="Tokens"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="calls"
            name="Calls"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LlmLatencyChart({ data }: Props) {
  const chartData = useMemo(() =>
    data.map(d => ({ date: d.date.slice(5), latency: d.avgLatency })),
    [data],
  );

  return (
    <div className="w-full [&_.recharts-cartesian-axis-tick_text]:!fill-muted-foreground">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={v => `${v}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="latency"
            name="Avg Latency (ms)"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#latencyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
