'use client';

import { Loader2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { useApi } from '@/components/hooks/useApi';
import { useDateParameters } from '@/components/hooks/useDateParameters';
import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import { RetentionMatrix } from './RetentionMatrix';

export function RetentionPage({ projectId }: { projectId: string }) {
  const { post } = useApi();
  const { startDate, endDate, timezone } = useDateParameters();
  const filters = useFilterParameters();

  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const runRetention = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await post('/reports/retention', {
          projectId,
          type: 'retention',
          filters,
          parameters: {
            startDate,
            endDate,
            timezone,
          },
        });
        if (isMounted) setResults(data);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to run retention analysis');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    runRetention();

    return () => {
      isMounted = false;
    };
  }, [projectId, startDate, endDate, timezone, filters, post]);

  return (
    <div className="flex flex-col gap-4">
      <ProjectControls projectId={projectId} />

      {/* Legend */}
      {results && !error && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">Retention rate:</span>
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

      {/* Matrix panel */}
      <Panel title="Retention Matrix" allowFullscreen overflow="auto">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Calculating retention cohorts…</p>
          </div>
        )}

        {results && !isLoading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-medium text-foreground">No retention data found</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Try expanding the date range or removing filters
            </p>
          </div>
        )}

        {results && !isLoading && !error && results.length > 0 && (
          <div>
            <p className="mb-4 text-xs text-muted-foreground">
              Showing <strong>{results.length}</strong> data points across{' '}
              <strong>{new Set(results.map((r: any) => r.date)).size}</strong> cohorts. Hover a cell
              to see exact counts.
            </p>
            <RetentionMatrix data={results} />
          </div>
        )}
      </Panel>
    </div>
  );
}
