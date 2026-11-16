import { getLlmModelBreakdown } from '@vision/db';
import { Badge } from '@/components/ui/badge';

interface Props { projectId: string; }

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  anthropic: 'bg-orange-100 text-orange-800 border-orange-200',
  google: 'bg-blue-100 text-blue-800 border-blue-200',
  mistral: 'bg-violet-100 text-violet-800 border-violet-200',
};

function providerClass(provider: string) {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? 'bg-muted text-muted-foreground';
}

export async function ModelBreakdownTable({ projectId }: Props) {
  const rows = await getLlmModelBreakdown(projectId);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No model data yet. Send your first LLM trace to see per-model stats.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 text-left font-medium">Model</th>
            <th className="pb-2 text-right font-medium">Calls</th>
            <th className="pb-2 text-right font-medium">Tokens</th>
            <th className="pb-2 text-right font-medium">Total Cost</th>
            <th className="pb-2 text-right font-medium">Avg Latency</th>
            <th className="pb-2 text-right font-medium">Error Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(row => (
            <tr key={`${row.provider}:${row.model}`} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={providerClass(row.provider)}>
                    {row.provider}
                  </Badge>
                  <span className="font-mono text-xs text-foreground">{row.model}</span>
                </div>
              </td>
              <td className="py-2.5 text-right tabular-nums">{row.totalCalls.toLocaleString()}</td>
              <td className="py-2.5 text-right tabular-nums">
                {row.totalTokens >= 1_000_000
                  ? `${(row.totalTokens / 1_000_000).toFixed(2)}M`
                  : row.totalTokens >= 1_000
                  ? `${(row.totalTokens / 1_000).toFixed(1)}k`
                  : row.totalTokens.toLocaleString()}
              </td>
              <td className="py-2.5 text-right tabular-nums font-medium">
                ${row.totalCost.toFixed(4)}
              </td>
              <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                {Math.round(row.avgLatency)}ms
              </td>
              <td className="py-2.5 text-right tabular-nums">
                <span
                  className={
                    row.errorRate > 0.05
                      ? 'text-destructive font-semibold'
                      : row.errorRate > 0.01
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                  }
                >
                  {(row.errorRate * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
