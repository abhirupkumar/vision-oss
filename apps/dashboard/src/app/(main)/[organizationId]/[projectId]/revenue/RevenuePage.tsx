'use client';

import { useState } from 'react';
import { useApi } from '@/components/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { BadgeDollarSign, TrendingUp, User, CreditCard, Sparkles } from 'lucide-react';

function SkeletonCard({ height = 'h-24' }: { height?: string }) {
  return <div className={`${height} animate-pulse rounded-md bg-muted w-full`} />;
}

export function RevenuePage({ projectId }: { projectId: string }) {
  const { get } = useApi();
  const [page, setPage] = useState(1);

  const statsQ = useQuery<any>({
    queryKey: ['revenue-stats', projectId],
    queryFn: () => get(`/projects/${projectId}/revenue/stats`),
  });

  const unitEconQ = useQuery<any>({
    queryKey: ['unit-economics-summary', projectId],
    queryFn: () => get(`/projects/${projectId}/revenue/unit-economics`),
  });

  const usersQ = useQuery<{ data: any[]; total: number; page: number; limit: number; totalPages: number } | any[]>({
    queryKey: ['revenue-users', projectId, page],
    queryFn: () => get(`/projects/${projectId}/revenue/users?page=${page}&limit=25`),
  });

  const stats = statsQ.data ?? { sum: 0, count: 0, avg: 0 };
  const unitEcon = unitEconQ.data ?? { totalRevenue: 0, totalLlmCost: 0, grossMargin: 0, grossMarginPct: 0 };

  const users: any[] = Array.isArray(usersQ.data)
    ? usersQ.data
    : (usersQ.data?.data ?? []);
  const totalUsers: number = Array.isArray(usersQ.data)
    ? usersQ.data.length
    : (usersQ.data?.total ?? users.length);
  const totalPages: number = Array.isArray(usersQ.data)
    ? Math.max(1, Math.ceil(usersQ.data.length / 25))
    : (usersQ.data?.totalPages ?? 1);

  const totalRevenue = Number(stats.sum || unitEcon.totalRevenue || 0);
  const totalLlmCost = Number(unitEcon.totalLlmCost ?? users.reduce((acc: number, u: any) => acc + Number(u.llmCost || 0), 0));
  const grossMargin = unitEcon.grossMargin ?? (totalRevenue - totalLlmCost);
  const marginPct = unitEcon.grossMarginPct ?? (totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Revenue Analytics"
        description="Monitor payments, subscriptions, and revenue attributed to active customer sessions."
        icon={<BadgeDollarSign className="h-5 w-5 text-primary" />}
      />

      {/* ── Top Metrics Bar ── */}
      {statsQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.count || 0} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                ${Number(stats.avg || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-primary">
                ${grossMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">After ${totalLlmCost.toFixed(2)} AI cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margin Percentage</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {marginPct.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Net revenue efficiency</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Revenue by User Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Revenue &amp; Margins</CardTitle>
          <CardDescription>
            Paid revenue, AI inference cost, and net gross margin per user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQ.isLoading ? (
            <SkeletonCard height="h-32" />
          ) : !users.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No attributed user revenue yet. Connect Stripe, Paddle, Polar, or Lemon Squeezy in Settings.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 text-left font-medium">User ID</th>
                      <th className="pb-2 text-left font-medium">Tier</th>
                      <th className="pb-2 text-right font-medium">Revenue</th>
                      <th className="pb-2 text-right font-medium">AI Compute Cost</th>
                      <th className="pb-2 text-right font-medium">Gross Margin</th>
                      <th className="pb-2 text-right font-medium">Margin %</th>
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
