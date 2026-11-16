'use client';
import Link from 'next/link';
import { Sparkles, ArrowRight, Zap, Coins, Clock } from 'lucide-react';
import { useProjectStatsQuery } from '@/components/hooks/queries/useProjectStatsQuery';
import { useNavigation } from '@/components/hooks';

export function ProjectAiOverviewPanel({ projectId }: { projectId: string }) {
  const { renderUrl } = useNavigation();
  const { data } = useProjectStatsQuery(projectId);

  if (!data?.llmCost && !data?.llmTokens) {
    return null;
  }

  const tokens = data.llmTokens || 0;
  const cost = data.llmCost || 0;
  const latency = data.llmAvgLatency || 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">AI Operations &amp; Model Spend</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                Active Proxy
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total LLM tokens, model API costs, and latency across all active sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Model Spend</div>
              <div className="text-sm font-bold font-mono text-primary">${cost.toFixed(4)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Tokens</div>
              <div className="text-sm font-bold font-mono text-foreground">
                {tokens >= 1_000_000
                  ? `${(tokens / 1_000_000).toFixed(2)}M`
                  : tokens >= 1_000
                    ? `${(tokens / 1_000).toFixed(1)}k`
                    : tokens.toLocaleString()}
              </div>
            </div>
          </div>

          {latency > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Avg Latency</div>
                <div className="text-sm font-bold font-mono text-foreground">{Math.round(latency)}ms</div>
              </div>
            </div>
          )}

          <Link
            href={renderUrl(`/${projectId}/llm`)}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-all hover:bg-secondary/90 shadow-sm"
          >
            <span>LLM Observability</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
