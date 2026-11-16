'use client';

import { ChevronDown, Loader2, Play, Save } from 'lucide-react';
import { useState } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { useApi } from '@/components/hooks/useApi';
import { useDateParameters } from '@/components/hooks/useDateParameters';
import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { FunnelResults } from './FunnelResults';
import { type FunnelStep, FunnelStepBuilder } from './FunnelStepBuilder';

const WINDOW_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '7 days', value: 10080 },
];

export function FunnelPage({ projectId }: { projectId: string }) {
  const { post } = useApi();
  const { startDate, endDate, timezone } = useDateParameters();
  const filters = useFilterParameters();

  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [window, setWindow] = useState(1440);
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = steps.length >= 2 && steps.every(s => s.value.trim() !== '');

  const runFunnel = async () => {
    if (!canRun) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await post('/reports/funnel', {
        projectId,
        type: 'funnel',
        filters,
        parameters: {
          startDate,
          endDate,
          timezone,
          window,
          steps: steps.map(s => ({ type: s.type, value: s.value })),
        },
      });
      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to run funnel analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Config Panel */}
        <Panel className="flex flex-col gap-6 h-fit">
          <div>
            <h2 className="text-base font-semibold text-foreground">Funnel Builder</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define steps users must complete in sequence
            </p>
          </div>

          <FunnelStepBuilder steps={steps} onChange={setSteps} />

          {/* Conversion window */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Conversion Window</Label>
            <div className="relative">
              <select
                value={window}
                onChange={e => setWindow(Number(e.target.value))}
                className={cn(
                  'w-full h-9 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                )}
              >
                {WINDOW_OPTIONS.map(opt => (
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
            <p className="text-xs text-muted-foreground">Max time allowed between steps</p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <Button onClick={runFunnel} disabled={!canRun || isLoading} className="w-full">
            {isLoading ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <Play size={14} className="mr-2" />
            )}
            {isLoading ? 'Running…' : 'Run Funnel'}
          </Button>

          {!canRun && steps.length < 2 && (
            <p className="text-center text-xs text-muted-foreground -mt-2">
              Add at least 2 steps to run the funnel
            </p>
          )}
        </Panel>

        {/* Results Panel */}
        <Panel title="Funnel Results" allowFullscreen minHeight="400px">
          {results === null && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
                <Play size={22} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No results yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  Define your funnel steps and click <strong>Run Funnel</strong> to see the analysis
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analysing funnel…</p>
            </div>
          )}

          {results && !isLoading && <FunnelResults data={results} steps={steps} />}
        </Panel>
      </div>
    </div>
  );
}
