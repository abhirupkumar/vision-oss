'use client';

import { useState, useCallback } from 'react';
import { useApi } from '@/components/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Sparkles, Activity, Coins, Clock, Zap, AlertTriangle,
  Globe, User, TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LlmCostChart, LlmTokenChart, LlmLatencyChart } from './LlmTimeSeriesChart';
import { TracesTableClient, Pagination } from './TracesTableClient';

// ── Helpers ───────────────────────────────────────────────────────────────────

function SkeletonCard({ height = 'h-48' }: { height?: string }) {
  return <div className={`${height} animate-pulse rounded-md bg-muted w-full`} />;
}

function MetricCard({
  title, value, icon, sub,
}: { title: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Provider badge colours ────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  anthropic: 'bg-orange-100 text-orange-800 border-orange-200',
  google: 'bg-blue-100 text-blue-800 border-blue-200',
  mistral: 'bg-violet-100 text-violet-800 border-violet-200',
};
function providerClass(p: string) {
  return PROVIDER_COLORS[p.toLowerCase()] ?? 'bg-muted text-muted-foreground';
}

function ScoreDot({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-destructive';
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="tabular-nums">{pct}%</span>
    </div>
  );
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function ErrorRateCell({ rate }: { rate: number }) {
  return (
    <span className={
      rate > 0.05 ? 'text-destructive font-semibold' :
      rate > 0.01 ? 'text-amber-600' : 'text-muted-foreground'
    }>
      {(rate * 100).toFixed(1)}%
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
      {children}
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export function LlmPage({ projectId }: { projectId: string }) {
  const { get } = useApi();

  const base = `/projects/${projectId}/llm`;

  // 30-day window
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const metricsQ = useQuery<any>({
    queryKey: ['llm-metrics', projectId],
    queryFn: () => get(`${base}/metrics`),
  });

  const seriesQ = useQuery<any[]>({
    queryKey: ['llm-series', projectId],
    queryFn: () => get(`${base}/series`, { startDate, endDate, granularity: 'day' }),
  });

  const modelQ = useQuery<any[]>({
    queryKey: ['llm-model-breakdown', projectId],
    queryFn: () => get(`${base}/model-breakdown`),
  });

  const forecastQ = useQuery<any>({
    queryKey: ['llm-cost-forecast', projectId],
    queryFn: () => get(`${base}/cost-forecast`),
  });

  const templateQ = useQuery<any[]>({
    queryKey: ['llm-template-stats', projectId],
    queryFn: () => get(`${base}/template-stats`),
  });

  const [templatePage, setTemplatePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [countryPage, setCountryPage] = useState(1);

  const userQ = useQuery<{ data: any[]; total: number; totalPages: number } | any[]>({
    queryKey: ['llm-user-breakdown', projectId, userPage],
    queryFn: () => get(`${base}/user-breakdown`, { page: userPage, limit: 25 }),
    placeholderData: (prev) => prev,
  });

  const countryQ = useQuery<any[]>({
    queryKey: ['llm-country-breakdown', projectId],
    queryFn: () => get(`${base}/country-breakdown`),
  });

  const [tracesPage, setTracesPage] = useState(1);

  const tracesQ = useQuery<{ data: any[]; total: number; totalPages: number }>({
    queryKey: ['llm-traces', projectId, tracesPage],
    queryFn: () => get(`${base}/traces`, { page: tracesPage, limit: 50 }),
    placeholderData: (prev) => prev,
  });

  // Derived top-level stats
  const metrics = metricsQ.data ?? { totalTokens: 0, totalCost: 0, avgLatency: 0, avgTtft: 0, cacheReads: 0, cacheWrites: 0 };
  const series: any[] = seriesQ.data ?? [];
  const totalCalls = series.reduce((s, d) => s + (d.totalCalls ?? 0), 0);
  const totalErrors = series.reduce((s, d) => s + (d.errorCount ?? 0), 0);
  const errorRate = totalCalls > 0 ? totalErrors / totalCalls : 0;

  const forecast = forecastQ.data ?? { mtdCost: 0, projectedMonthCost: 0, daysElapsed: 1, daysInMonth: 30 };

  const templateRows: any[] = templateQ.data ?? [];
  const templateTotal = templateRows.length;
  const templateTotalPages = Math.max(1, Math.ceil(templateTotal / 25));
  const displayedTemplateRows = templateRows.slice((templatePage - 1) * 25, templatePage * 25);

  const countryRows: any[] = countryQ.data ?? [];
  const countryTotal = countryRows.length;
  const countryTotalPages = Math.max(1, Math.ceil(countryTotal / 25));
  const displayedCountryRows = countryRows.slice((countryPage - 1) * 25, countryPage * 25);

  const userRows: any[] = Array.isArray(userQ.data)
    ? userQ.data
    : (userQ.data?.data ?? []);
  const userTotal: number = Array.isArray(userQ.data)
    ? userQ.data.length
    : (userQ.data?.total ?? userRows.length);
  const userTotalPages: number = Array.isArray(userQ.data)
    ? Math.max(1, Math.ceil(userQ.data.length / 25))
    : (userQ.data?.totalPages ?? 1);
  const displayedUserRows = Array.isArray(userQ.data) && userQ.data.length > 25
    ? userQ.data.slice((userPage - 1) * 25, userPage * 25)
    : userRows;

  // Traces: pass fetch fn to the existing client table so it can load waterfalls
  const fetchWaterfall = useCallback(async (traceId: string) => {
    try { return await get(`${base}/traces/${traceId}`); }
    catch { return []; }
  }, [get, base]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="LLM Observability"
        description="Monitor token usage, costs, latency, errors, and traces for all your AI features."
        icon={<Sparkles className="h-5 w-5 text-primary" />}
      />

      {/* ── Metrics Bar ── */}
      {metricsQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard title="Total Calls" value={totalCalls.toLocaleString()} icon={<Activity className="h-4 w-4" />} sub="Last 30 days" />
          <MetricCard
            title="Total Tokens"
            value={fmtTokens(metrics.totalTokens)}
            icon={<Zap className="h-4 w-4" />}
            sub={metrics.cacheReads > 0 ? `${metrics.cacheReads.toLocaleString()} cached` : undefined}
          />
          <MetricCard title="Estimated Cost" value={`$${Number(metrics.totalCost).toFixed(4)}`} icon={<Coins className="h-4 w-4" />} />
          <MetricCard title="Avg Latency" value={`${(Number(metrics.avgLatency) / 1000).toFixed(2)}s`} icon={<Clock className="h-4 w-4" />} />
          <MetricCard title="Avg TTFT" value={metrics.avgTtft > 0 ? `${(Number(metrics.avgTtft) / 1000).toFixed(2)}s` : 'N/A'} icon={<Clock className="h-4 w-4" />} />
          <MetricCard title="Error Rate" value={`${(errorRate * 100).toFixed(1)}%`} icon={<AlertTriangle className="h-4 w-4" />} sub={`${totalErrors} errors`} />
        </div>
      )}

      {/* ── Time-Series Charts ── */}
      {seriesQ.isLoading ? (
        <SkeletonCard height="h-48" />
      ) : series.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cost Trend</CardTitle>
              <CardDescription>Daily API spend (USD)</CardDescription>
            </CardHeader>
            <CardContent className="pt-0"><LlmCostChart data={series} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Token & Call Volume</CardTitle>
              <CardDescription>Daily tokens and request count</CardDescription>
            </CardHeader>
            <CardContent className="pt-0"><LlmTokenChart data={series} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Latency Trend</CardTitle>
              <CardDescription>Average response time per day</CardDescription>
            </CardHeader>
            <CardContent className="pt-0"><LlmLatencyChart data={series} /></CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No LLM data yet. Send your first trace to see trends.
          </CardContent>
        </Card>
      )}

      {/* ── Model Breakdown + Cost Forecast ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Model Breakdown</CardTitle>
            <CardDescription>Per-model cost, latency, and error rate</CardDescription>
          </CardHeader>
          <CardContent>
            {modelQ.isLoading ? <SkeletonCard height="h-32" /> :
             !modelQ.data?.length ? (
               <EmptyState>
                 <p className="text-sm text-muted-foreground">No model data yet. Send your first LLM trace to see per-model stats.</p>
               </EmptyState>
             ) : (
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
                     {modelQ.data.map((row: any) => (
                       <tr key={`${row.provider}:${row.model}`} className="hover:bg-muted/30 transition-colors">
                         <td className="py-2.5">
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className={providerClass(row.provider)}>{row.provider}</Badge>
                             <span className="font-mono text-xs text-foreground">{row.model}</span>
                           </div>
                         </td>
                         <td className="py-2.5 text-right tabular-nums">{row.totalCalls.toLocaleString()}</td>
                         <td className="py-2.5 text-right tabular-nums">{fmtTokens(row.totalTokens)}</td>
                         <td className="py-2.5 text-right tabular-nums font-medium">${row.totalCost.toFixed(4)}</td>
                         <td className="py-2.5 text-right tabular-nums text-muted-foreground">{Math.round(row.avgLatency)}ms</td>
                         <td className="py-2.5 text-right tabular-nums"><ErrorRateCell rate={row.errorRate} /></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Forecast</CardTitle>
            <CardDescription>Month-to-date spend &amp; projection</CardDescription>
          </CardHeader>
          <CardContent>
            {forecastQ.isLoading ? <SkeletonCard height="h-32" /> : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Month to Date</p>
                    <p className="text-2xl font-bold tabular-nums mt-0.5">${Number(forecast.mtdCost).toFixed(4)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Projected</p>
                    <p className="text-2xl font-bold tabular-nums mt-0.5 text-primary">${Number(forecast.projectedMonthCost).toFixed(4)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Day {forecast.daysElapsed} of {forecast.daysInMonth}</span>
                    <span>{Math.round((forecast.daysElapsed / forecast.daysInMonth) * 100)}% through month</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/40 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (forecast.daysElapsed / forecast.daysInMonth) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Spend progress</span>
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${forecast.projectedMonthCost > 0 ? Math.min(100, (forecast.mtdCost / forecast.projectedMonthCost) * 100) : 0}%` }} />
                  </div>
                </div>
                {forecast.mtdCost === 0 && <p className="text-xs text-muted-foreground text-center">No LLM spend this month yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Template Performance ── */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Template Performance</CardTitle>
          <CardDescription>Costs, latency, and quality scores grouped by template name</CardDescription>
        </CardHeader>
        <CardContent>
          {templateQ.isLoading ? <SkeletonCard height="h-24" /> :
           !templateQ.data?.length ? (
             <EmptyState>
               <p className="text-sm text-muted-foreground">No prompt templates tracked yet.</p>
               <p className="text-xs text-muted-foreground">Pass <code className="bg-muted px-1 rounded">templateName</code> in your LLM traces to group them here.</p>
             </EmptyState>
           ) : (
            <>
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
                   {displayedTemplateRows.map((row: any) => (
                     <tr key={row.templateName ?? ''} className="hover:bg-muted/30 transition-colors">
                       <td className="py-2.5"><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{row.templateName}</span></td>
                       <td className="py-2.5 text-right tabular-nums">{row.totalCalls.toLocaleString()}</td>
                       <td className="py-2.5 text-right tabular-nums font-medium">${row.avgCost.toFixed(5)}</td>
                       <td className="py-2.5 text-right tabular-nums text-muted-foreground">{Math.round(row.avgLatency)}ms</td>
                       <td className="py-2.5 text-right"><ScoreDot score={row.avgScore} /></td>
                       <td className="py-2.5 text-right tabular-nums"><ErrorRateCell rate={row.errorRate} /></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

                {templateTotal > 25 && (
                  <div className="flex items-center justify-between px-1 pt-3 text-xs text-muted-foreground border-t border-border mt-3">
                    <span>
                      Showing {(templatePage - 1) * 25 + 1}–{Math.min(templatePage * 25, templateTotal)} of {templateTotal.toLocaleString()} templates
                    </span>
                    <Pagination page={templatePage} totalPages={templateTotalPages} onPageChange={setTemplatePage} />
                  </div>
                )}
            </>
           )}
        </CardContent>
      </Card>

      {/* ── User & Country Breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Cost &amp; Activity</CardTitle>
            <CardDescription>Top users by LLM token consumption &amp; spend</CardDescription>
          </CardHeader>
          <CardContent>
            {userQ.isLoading ? <SkeletonCard height="h-32" /> :
             !displayedUserRows.length ? (
               <EmptyState>
                 <p className="text-sm text-muted-foreground">No user-attributed LLM activity yet.</p>
                 <p className="text-xs text-muted-foreground">Pass <code className="bg-muted px-1 rounded">X-Vision-User-Id</code> header in your proxy requests.</p>
               </EmptyState>
             ) : (
            <>
               <div className="flex flex-col gap-3">
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead>
                       <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                         <th className="pb-2 text-left font-medium">User ID</th>
                         <th className="pb-2 text-right font-medium">Calls</th>
                         <th className="pb-2 text-right font-medium">Tokens</th>
                         <th className="pb-2 text-right font-medium">Total Spend</th>
                         <th className="pb-2 text-right font-medium">Avg Latency</th>
                         <th className="pb-2 text-right font-medium">Last Active</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                       {displayedUserRows.map((row: any) => (
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
                           <td className="py-2.5 text-right tabular-nums">{fmtTokens(row.totalTokens)}</td>
                           <td className="py-2.5 text-right tabular-nums font-semibold text-primary">${row.totalCost.toFixed(4)}</td>
                           <td className="py-2.5 text-right tabular-nums text-muted-foreground">{Math.round(row.avgLatency)}ms</td>
                           <td className="py-2.5 text-right tabular-nums text-xs text-muted-foreground">
                             {row.lastActive ? new Date(row.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 {/* Pagination */}
                 <div className="flex items-center justify-between px-1 pt-3 text-xs text-muted-foreground border-t border-border">
                   <span>{userTotal.toLocaleString()} user{userTotal !== 1 ? 's' : ''} total</span>
                   <Pagination page={userPage} totalPages={userTotalPages} onPageChange={setUserPage} />
                 </div>
               </div>
            </>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>LLM request volume and latency by country</CardDescription>
          </CardHeader>
          <CardContent>
            {countryQ.isLoading ? <SkeletonCard height="h-32" /> :
             !countryQ.data?.length ? (
               <EmptyState>
                 <p className="text-sm text-muted-foreground">No geographic data recorded yet.</p>
                 <p className="text-xs text-muted-foreground">Country codes are captured from <code className="bg-muted px-1 rounded">cf-ipcountry</code> headers.</p>
               </EmptyState>
             ) : (
                <>
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
                     {displayedCountryRows.map((row: any) => (
                       <tr key={row.countryCode} className="hover:bg-muted/30 transition-colors">
                         <td className="py-2.5">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                               <Globe className="w-3.5 h-3.5" />
                             </div>
                             <span className="font-mono text-xs font-bold text-foreground">{row.countryCode.toUpperCase()}</span>
                           </div>
                         </td>
                         <td className="py-2.5 text-right tabular-nums">{row.totalCalls.toLocaleString()}</td>
                         <td className="py-2.5 text-right tabular-nums">{fmtTokens(row.totalTokens)}</td>
                         <td className="py-2.5 text-right tabular-nums font-medium">${row.totalCost.toFixed(4)}</td>
                         <td className="py-2.5 text-right tabular-nums text-muted-foreground">{Math.round(row.avgLatency)}ms</td>
                         <td className="py-2.5 text-right tabular-nums"><ErrorRateCell rate={row.errorRate} /></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

                {countryTotal > 25 && (
                  <div className="flex items-center justify-between px-1 pt-3 text-xs text-muted-foreground border-t border-border mt-3">
                    <span>
                      Showing {(countryPage - 1) * 25 + 1}–{Math.min(countryPage * 25, countryTotal)} of {countryTotal.toLocaleString()} countries
                    </span>
                    <Pagination page={countryPage} totalPages={countryTotalPages} onPageChange={setCountryPage} />
                  </div>
                )}
              </>
             )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Traces ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Traces</CardTitle>
          <CardDescription>LLM traces and performance metrics — click any row to expand</CardDescription>
        </CardHeader>
        <CardContent>
          {tracesQ.isLoading
            ? <SkeletonCard height="h-64" />
            : <TracesTableClient
                traces={tracesQ.data?.data ?? []}
                projectId={projectId}
                fetchWaterfall={fetchWaterfall}
                page={tracesPage}
                totalPages={tracesQ.data?.totalPages ?? 1}
                total={tracesQ.data?.total}
                onPageChange={setTracesPage}
              />
          }
        </CardContent>
      </Card>
    </div>
  );
}
