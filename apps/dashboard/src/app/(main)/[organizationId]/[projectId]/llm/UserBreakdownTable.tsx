import { getLlmUserBreakdown } from '@vision/db';
import { User } from 'lucide-react';

interface Props {
  projectId: string;
}

export async function UserBreakdownTable({ projectId }: Props) {
  const res = await getLlmUserBreakdown(projectId);
  const rows = Array.isArray(res) ? res : res.data;

  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
        <p className="text-sm text-muted-foreground">No user-attributed LLM activity yet.</p>
        <p className="text-xs text-muted-foreground">
          Pass <code className="bg-muted px-1 rounded">X-Vision-User-Id</code> header in your proxy requests to track per-user costs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 text-left font-medium">User ID</th>
            <th className="pb-2 text-right font-medium">Calls</th>
            <th className="pb-2 text-right font-medium">Tokens</th>
            <th className="pb-2 text-right font-medium">Total Spend</th>
            <th className="pb-2 text-right font-medium">Avg Cost</th>
            <th className="pb-2 text-right font-medium">Avg Latency</th>
            <th className="pb-2 text-right font-medium">Last Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.userId} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-xs font-medium text-foreground">{row.userId}</span>
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
              <td className="py-2.5 text-right tabular-nums font-semibold text-primary">
                ${row.totalCost.toFixed(4)}
              </td>
              <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                ${row.avgCost.toFixed(5)}
              </td>
              <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                {Math.round(row.avgLatency)}ms
              </td>
              <td className="py-2.5 text-right tabular-nums text-xs text-muted-foreground">
                {row.lastActive ? new Date(row.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
