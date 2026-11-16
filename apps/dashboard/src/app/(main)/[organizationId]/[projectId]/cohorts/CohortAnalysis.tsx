'use client';

import { ChevronDown, Loader2, Play } from 'lucide-react';
import { useState } from 'react';
import { Panel } from '@/components/common/Panel';
import { useApi } from '@/components/hooks/useApi';
import { useDateParameters } from '@/components/hooks/useDateParameters';
import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { RetentionMatrix } from '../retention/RetentionMatrix';

const INTERVAL_OPTIONS = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
];

export function CohortAnalysis({ projectId }: { projectId: string }) {
  const { post } = useApi();
  const { startDate, endDate, timezone } = useDateParameters();
  const filters = useFilterParameters();

  const [entryEvent, setEntryEvent] = useState('');
  const [returnEvent, setReturnEvent] = useState('');
  const [interval, setInterval] = useState('day');
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = entryEvent.trim() !== '' && returnEvent.trim() !== '';

  const runAnalysis = async () => {
    if (!canRun) return;
    setIsLoading(true);
    setError(null);
    try {
      // The retention API accepts an 'event' filter to scope the cohort
      // entryEvent scopes who enters the cohort, returnEvent is descriptive here
      // (the retention query tracks re-visits to any page after first event match)
      const data = await post('/reports/retention', {
        projectId,
        type: 'retention',
        filters: {
          ...filters,
          // Filter sessions that performed the entry event
          event: entryEvent.trim() || undefined,
        },
        parameters: {
          startDate,
          endDate,
          timezone,
        },
      });
      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to run cohort analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Config panel */}
      <Panel className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Entry Event / Page
          </Label>
          <Input
            className="h-9 text-sm"
            placeholder="e.g. signed_up or /register"
            value={entryEvent}
            onChange={e => setEntryEvent(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Users who perform this action enter the cohort
          </p>
        </div>

        <div className="flex items-center self-center text-muted-foreground">→</div>

        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Return Event / Page
          </Label>
          <Input
            className="h-9 text-sm"
            placeholder="e.g. logged_in or /dashboard"
            value={returnEvent}
            onChange={e => setReturnEvent(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">Return event that counts as retention</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Interval
          </Label>
          <div className="relative">
            <select
              value={interval}
              onChange={e => setInterval(e.target.value)}
              className={cn(
                'h-9 min-w-[110px] appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            >
              {INTERVAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <Button onClick={runAnalysis} disabled={isLoading || !canRun}>
          {isLoading ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Play size={14} className="mr-2" />
          )}
          {isLoading ? 'Analysing…' : 'Run Analysis'}
        </Button>

        {error && <p className="text-xs text-destructive w-full">{error}</p>}
        {!canRun && (
          <p className="text-xs text-muted-foreground w-full">
            Fill in both Entry and Return events to run the analysis
          </p>
        )}
      </Panel>

      {/* Legend */}
      {results && results.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">Retention:</span>
          <div className="flex items-center gap-1">
            {[0, 25, 50, 75, 100].map(pct => (
              <div
                key={pct}
                className="flex h-5 w-10 items-center justify-center rounded text-[10px] font-medium"
                style={{
                  background: `hsla(143, 71%, 42%, ${0.08 + (pct / 100) * 0.82})`,
                  color: pct >= 50 ? '#064e3b' : 'var(--foreground)',
                }}
              >
                {pct}%
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">→ higher</span>
        </div>
      )}

      {/* Matrix */}
      <Panel title="Cohort Retention Matrix" allowFullscreen overflow="auto">
        {results === null && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
              <Play size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No analysis yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                Define entry and return events, then click <strong>Run Analysis</strong>
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Building cohort matrix…</p>
          </div>
        )}

        {results && !isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p className="text-sm font-medium text-foreground">No cohort data found</p>
            <p className="text-xs text-muted-foreground">
              Try a broader date range or different events
            </p>
          </div>
        )}

        {results && !isLoading && results.length > 0 && (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              Users who first performed <strong className="text-foreground">{entryEvent}</strong>{' '}
              and then returned via <strong className="text-foreground">{returnEvent}</strong>.
              Hover a cell to see exact counts.
            </p>
            <RetentionMatrix data={results} />
          </>
        )}
      </Panel>
    </div>
  );
}
