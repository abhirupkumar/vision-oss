import { getLlmCountryBreakdown } from '@vision/db';
import { Globe } from 'lucide-react';

interface Props {
  projectId: string;
}

export async function CountryBreakdownTable({ projectId }: Props) {
  const rows = await getLlmCountryBreakdown(projectId);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
        <p className="text-sm text-muted-foreground">No geographic data recorded yet.</p>
        <p className="text-xs text-muted-foreground">
          Country codes are automatically captured from edge headers (<code className="bg-muted px-1 rounded">cf-ipcountry</code>) on incoming proxy requests.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 text-left font-medium">Country</th>
            <th className="pb-2 text-right font-medium">Calls</th>
            <th className="pb-2 text-right font-medium">Tokens</th>
            <th className="pb-2 text-right font-medium">Total Cost</th>
            <th className="pb-2 text-right font-medium">Avg Latency</th>
            <th className="pb-2 text-right font-medium">Error Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.countryCode} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {row.countryCode.toUpperCase()}
                  </span>
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
