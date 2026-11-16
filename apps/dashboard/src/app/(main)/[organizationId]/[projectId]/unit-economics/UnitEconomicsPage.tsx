'use client';

import { useState } from 'react';
import { useApi } from '@/components/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import {
  BadgeDollarSign,
  TrendingUp,
  User,
  Coins,
  AlertTriangle,
  Scale,
  Zap,
} from 'lucide-react';

function SkeletonCard({ height = 'h-24' }: { height?: string }) {
  return <div className={`${height} animate-pulse rounded-md bg-muted w-full`} />;
}

export function UnitEconomicsPage({ projectId }: { projectId: string }) {
  const { get } = useApi();
  const [page, setPage] = useState(1);

  const summaryQ = useQuery<any>({
    queryKey: ['unit-economics-summary', projectId],
    queryFn: () => get(`/projects/${projectId}/revenue/unit-economics`),
  });

  const usersQ = useQuery<{ data: any[]; total: number; page: number; limit: number; totalPages: number } | any[]>({
    queryKey: ['revenue-users', projectId, page],
    queryFn: () => get(`/projects/${projectId}/revenue/users?page=${page}&limit=25`),
  });

  const summary = summaryQ.data ?? {
    totalRevenue: 0,
    totalLlmCost: 0,
    grossMargin: 0,
    grossMarginPct: 0,
    avgCostToServePerActiveUser: 0,
    aiRoiRatio: 0,
    unprofitableUserCount: 0,
    marginDistribution: [],
  };

  const users: any[] = Array.isArray(usersQ.data)
    ? usersQ.data
    : (usersQ.data?.data ?? []);
  const totalUsers: number = Array.isArray(usersQ.data)
    ? usersQ.data.length
    : (usersQ.data?.total ?? users.length);
  const totalPages: number = Array.isArray(usersQ.data)
    ? Math.max(1, Math.ceil(usersQ.data.length / 25))
    : (usersQ.data?.totalPages ?? 1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Unit Economics"
        description="Executive scorecard monitoring gross margins, cost-to-serve (CTS), and AI ROI per customer."
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />

      {/* ── Executive Scorecard KPI Strip ── */}
      {summaryQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blended Gross Margin</CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-primary">
                ${Number(summary.grossMargin || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(summary.grossMarginPct || 0).toFixed(1)}% of revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost-to-Serve (CTS)</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                ${Number(summary.avgCostToServePerActiveUser || 0).toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Avg compute per active account</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI ROI Ratio</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {Number(summary.aiRoiRatio || 0).toFixed(2)}x
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue per $1 compute spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts at Loss</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${summary.unprofitableUserCount > 0 ? 'text-destructive' : 'text-emerald-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold tabular-nums ${summary.unprofitableUserCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {summary.unprofitableUserCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">AI cost exceeds paid revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Margin Distribution Strip ── */}
      {summary.marginDistribution?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Margin Health Distribution</CardTitle>
            <CardDescription>Breakdown of active accounts by gross margin bracket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {summary.marginDistribution.map((item: any) => (
                <div key={item.range} className="rounded-lg border border-border p-3 bg-muted/20 flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-medium">{item.range}</span>
                  <div className="text-xl font-bold tabular-nums mt-1">{item.count} <span className="text-xs font-normal text-muted-foreground">accounts</span></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Customer Profitability P&L Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Unit P&amp;L</CardTitle>
          <CardDescription>
            Individual customer gross margins: paid revenue minus AI token compute cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQ.isLoading ? (
            <SkeletonCard height="h-48" />
          ) : !users.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No account telemetry available. Connect payments and track AI calls with user IDs to view unit economics.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 text-left font-medium">User ID</th>
                    <th className="pb-2 text-left font-medium">Plan</th>
                    <th className="pb-2 text-right font-medium">Paid Revenue</th>
                    <th className="pb-2 text-right font-medium">AI Compute Cost</th>
                    <th className="pb-2 text-right font-medium">Gross Margin</th>
                    <th className="pb-2 text-right font-medium">Margin %</th>
                    <th className="pb-2 text-right font-medium">Cost/Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((row) => (
                    <tr key={row.userId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-xs font-medium text-foreground">{row.userId}</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Badge variant="outline" className="text-xs font-normal">
                          {row.plan || 'Standard'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-semibold">
                        ${Number(row.revenue || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        ${Number(row.llmCost || 0).toFixed(4)}
                      </td>
                      <td className={`py-2.5 text-right tabular-nums font-semibold ${row.grossMargin >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        ${Number(row.grossMargin || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={row.marginPct >= 70 ? 'text-emerald-600 font-medium' : row.marginPct >= 40 ? 'text-amber-600' : 'text-destructive font-medium'}>
                          {Number(row.marginPct || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-xs text-muted-foreground font-mono">
                        ${Number(row.costToServe || 0).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalUsers > 25 && (
              <div className="flex items-center justify-between px-1 pt-4 text-xs text-muted-foreground border-t border-border mt-3">
                <span>
                  Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, totalUsers)} of {totalUsers.toLocaleString()} accounts
                </span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
