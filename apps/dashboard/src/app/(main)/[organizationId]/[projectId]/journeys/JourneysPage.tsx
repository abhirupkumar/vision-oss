'use client';

import { ChevronDown, Info, Loader2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { useApi } from '@/components/hooks/useApi';
import { useDateParameters } from '@/components/hooks/useDateParameters';
import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { JourneySankey } from './JourneySankey';

const STEP_OPTIONS = [3, 4, 5, 6, 7];

export function JourneysPage({ projectId }: { projectId: string }) {
  const { post } = useApi();
  const { startDate, endDate, timezone } = useDateParameters();
  const filters = useFilterParameters();

  const [startStep, setStartStep] = useState('');
  const [endStep, setEndStep] = useState('');
  const [steps, setSteps] = useState(5);
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runJourney = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await post('/reports/journey', {
        projectId,
        type: 'journey',
        filters,
        parameters: {
          startDate,
          endDate,
          timezone,
          steps,
          startStep: startStep.trim() || undefined,
          endStep: endStep.trim() || undefined,
        },
      });
      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to run journey analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Run automatically on mount and when date filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    runJourney();
  }, [projectId, startDate, endDate, timezone]);

  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} />

      {/* Config panel */}
      <Panel className="flex-row flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Start Page / Event
            <span className="ml-1 font-normal normal-case">(optional)</span>
          </Label>
          <Input
            className="h-9 text-sm"
            placeholder="/landing-page or event_name"
            value={startStep}
            onChange={e => setStartStep(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            End Page / Event
            <span className="ml-1 font-normal normal-case">(optional)</span>
          </Label>
          <Input
            className="h-9 text-sm"
            placeholder="/thank-you or conversion"
            value={endStep}
            onChange={e => setEndStep(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Steps
          </Label>
          <div className="relative">
            <select
              value={steps}
              onChange={e => setSteps(Number(e.target.value))}
              className={cn(
                'h-9 w-24 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            >
              {STEP_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n} steps
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <Button onClick={runJourney} disabled={isLoading}>
          {isLoading ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Play size={14} className="mr-2" />
          )}
          {isLoading ? 'Mapping…' : 'Map Journeys'}
        </Button>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </Panel>

      {/* Info hint */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-600 dark:text-blue-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>
          Leave Start / End fields blank to see <strong>all user paths</strong>. Fill in either to
          filter journeys that begin or end at a specific page or event. Each node is step-indexed
          to show the flow correctly.
        </span>
      </div>

      {/* Sankey panel */}
      <Panel title="User Journey Flow" allowFullscreen>
        {results === null && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
              <Play size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No journey data yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                Configure your filters above and click <strong>Map Journeys</strong> to visualise
                user flow
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Building journey map…</p>
          </div>
        )}

        {results && !isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-medium text-foreground">No journey paths found</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Try expanding the date range, removing filters, or changing start / end steps
            </p>
          </div>
        )}

        {results && !isLoading && results.length > 0 && (
          <div>
            <p className="mb-4 text-xs text-muted-foreground">
              Showing top <strong>{results.length}</strong> user journeys. Thicker lines represent
              more traffic.
            </p>
            <JourneySankey data={results} />
          </div>
        )}
      </Panel>
    </div>
  );
}
