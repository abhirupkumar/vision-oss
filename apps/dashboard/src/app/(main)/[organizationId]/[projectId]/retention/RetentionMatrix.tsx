'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';

export interface RetentionRow {
  date: string;
  day: number;
  visitors: number;
  returnVisitors: number;
  percentage: number;
}

function interpolateColor(pct: number): string {
  // 0% = muted bg, 100% = vivid primary-ish green
  const opacity = 0.08 + (pct / 100) * 0.82;
  return `hsla(143, 71%, 42%, ${opacity.toFixed(3)})`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function RetentionMatrix({ data }: { data: RetentionRow[] }) {
  const { cohorts, maxDay } = useMemo(() => {
    // Group rows by cohort date
    const cohortMap = new Map<string, Record<number, RetentionRow>>();
    for (const row of data) {
      if (!cohortMap.has(row.date)) cohortMap.set(row.date, {});
      cohortMap.get(row.date)![row.day] = row;
    }

    // Determine max day column (cap at 30)
    let max = 0;
    for (const rows of cohortMap.values()) {
      const days = Object.keys(rows).map(Number);
      max = Math.max(max, ...days);
    }
    max = Math.min(max, 30);

    const cohorts = Array.from(cohortMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rows]) => ({
        date,
        size: rows[0]?.visitors ?? 0,
        rows,
      }));

    return { cohorts, maxDay: max };
  }, [data]);

  if (cohorts.length === 0) return null;

  const days = Array.from({ length: maxDay + 1 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[100px] bg-card px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-r border-border">
              Cohort
            </th>
            <th className="min-w-[70px] px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
              Users
            </th>
            {days.map(day => (
              <th
                key={day}
                className="min-w-[56px] px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border"
              >
                {day === 0 ? 'Day 0' : `+${day}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(cohort => (
            <tr key={cohort.date} className="group hover:bg-muted/10 transition-colors">
              {/* Date */}
              <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/10 px-3 py-2 font-medium text-foreground border-b border-r border-border/50 transition-colors">
                {formatDate(cohort.date)}
              </td>
              {/* Cohort size */}
              <td className="px-3 py-2 text-right font-mono text-muted-foreground border-b border-border/50">
                {cohort.size.toLocaleString()}
              </td>
              {/* Day cells */}
              {days.map(day => {
                const row = cohort.rows[day];
                const pct = row ? Number(row.percentage) : null;
                return (
                  <td
                    key={day}
                    className="relative px-2 py-2 text-center border-b border-border/30 transition-all"
                    style={pct !== null ? { background: interpolateColor(pct) } : undefined}
                    title={
                      pct !== null
                        ? `${pct.toFixed(1)}% (${row!.returnVisitors.toLocaleString()} users)`
                        : undefined
                    }
                  >
                    {pct !== null ? (
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          pct >= 50 ? 'text-emerald-900 dark:text-emerald-100' : 'text-foreground',
                        )}
                      >
                        {pct === 100 ? '100%' : `${pct.toFixed(1)}%`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
