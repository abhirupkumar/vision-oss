import { getLlmTemplateStats } from '@vision/db';

interface Props { projectId: string; }

function ScoreDot({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-amber-400' :
    'bg-destructive';
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="tabular-nums">{pct}%</span>
    </div>
  );
}

export async function TemplateStatsTable({ projectId }: Props) {
  const rows = await getLlmTemplateStats(projectId);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
        <p className="text-sm text-muted-foreground">No prompt templates tracked yet.</p>
        <p className="text-xs text-muted-foreground">
          Pass <code className="bg-muted px-1 rounded">templateName</code> in your LLM traces to group them here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 text-left font-medium">Template</th>
            <th className="pb-2 text-right font-medium">Calls</th>
            <th className="pb-2 text-right font-medium">Avg Cost</th>
            <th className="pb-2 text-right font-medium">Avg Latency</th>
            <th className="pb-2 text-right font-medium">Quality Score</th>
            <th className="pb-2 text-right font-medium">Error Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(row => (
            <tr key={row.templateName ?? ''} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {row.templateName}
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums">{row.totalCalls.toLocaleString()}</td>
              <td className="py-2.5 text-right tabular-nums font-medium">
                ${row.avgCost.toFixed(5)}
              </td>
              <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                {Math.round(row.avgLatency)}ms
              </td>
              <td className="py-2.5 text-right">
                <ScoreDot score={row.avgScore} />
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
