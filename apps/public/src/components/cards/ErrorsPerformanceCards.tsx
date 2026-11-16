import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { AlertTriangle, Gauge, Activity, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

// ─── 1. REAL-TIME ERROR TRACKING CARD ────────────────────────────────────────
export function ErrorTrackingCard() {
  const [errors, setErrors] = useState([
    {
      id: 1,
      type: 'RateLimitError [429]',
      msg: 'OpenAI API rate limit exceeded on gpt-4o',
      route: '/api/v1/chat/completions',
      users: '42 users',
      time: 'Just now',
      tag: 'Auto-retried',
      tagColor: 'text-emerald-700 dark:text-[#00E599] bg-emerald-500/10',
    },
    {
      id: 2,
      type: 'PaymentWebhookError',
      msg: 'Stripe signature verification timeout',
      route: '/api/v1/webhooks/stripe',
      users: '3 users',
      time: '3m ago',
      tag: 'Investigating',
      tagColor: 'text-purple-700 dark:text-[#A78BFA] bg-purple-500/10',
    },
    {
      id: 3,
      type: 'InferenceTimeoutError',
      msg: 'Upstream TTFT exceeded 5,000ms threshold',
      route: '/api/v1/agent/query',
      users: '8 users',
      time: '12m ago',
      tag: 'Mitigated',
      tagColor: 'text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-white/[0.06]',
    },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setErrors((prev) => {
        const updated = [...prev];
        const randomIdx = Math.floor(Math.random() * updated.length);
        updated[randomIdx] = {
          ...updated[randomIdx],
          time: 'Just now',
        };
        return updated;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <FeatureCard
      title="Error Tracking"
      description="Capture unhandled exceptions, LLM rate limits, and checkout failures with stack traces and affected user counts."
    >
      <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-bdr">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Error Stream & Auto-Triage
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#00E599] font-bold">
            0 Fatal Crashes
          </span>
        </div>

        {/* Error Items Feed */}
        <div className="space-y-2 my-2">
          {errors.map((err) => (
            <motion.div
              key={err.id}
              layout
              className="p-3 rounded-2xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-t-primary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {err.type}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${err.tagColor}`}>
                  {err.tag}
                </span>
              </div>
              <p className="text-[11px] text-t-secondary truncate">{err.msg}</p>
              <div className="flex items-center justify-between text-[10px] text-t-muted pt-0.5">
                <span className="truncate max-w-[180px]">{err.route}</span>
                <span>{err.users} · {err.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent flex items-center justify-between text-[11px] font-sans">
          <span className="text-t-secondary flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00E599]" />
            Fallback Circuit Breaker:
          </span>
          <span className="text-emerald-700 dark:text-[#00E599] font-mono font-bold">Active (Auto-rerouting)</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. LATENCY & PERFORMANCE CARD ───────────────────────────────────────────
export function LatencyPerformanceCard() {
  const percentiles = [
    { label: 'P50 (Median TTFT)', latency: '165ms', score: 'Ultra Fast', pct: 28, color: 'bg-emerald-500 dark:bg-[#00E599]' },
    { label: 'P95 (Edge API)', latency: '280ms', score: 'Optimal', pct: 54, color: 'bg-purple-600 dark:bg-[#8B5CF6]' },
    { label: 'P99 (Inference Roundtrip)', latency: '490ms', score: 'Protected', pct: 78, color: 'bg-sky-500 dark:bg-[#38BDF8]' },
  ];

  return (
    <FeatureCard
      title="Latency & Performance"
      description="Measure P50, P95, and P99 latency percentiles across edge gateways, database lookups, and AI token generation."
    >
      <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-bdr">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <Gauge className="w-4 h-4 text-purple-600 dark:text-[#A78BFA]" />
            Percentile Latency Benchmarks
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-[#A78BFA] font-bold">
            Apdex: 0.98
          </span>
        </div>

        {/* Latency Gauges */}
        <div className="space-y-3.5 my-2">
          {percentiles.map((p) => (
            <div key={p.label} className="p-3 rounded-2xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] space-y-1.5 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-t-primary font-sans font-medium text-xs">{p.label}</span>
                <span className="font-bold text-t-primary text-sm">{p.latency}</span>
              </div>
              <div className="w-full h-2 bg-slate-200/70 dark:bg-white/[0.05] rounded-full overflow-hidden flex">
                <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-t-muted font-sans">
                <span>Threshold: &lt;500ms</span>
                <span className="text-emerald-700 dark:text-[#00E599] font-medium">{p.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Global Edge metric */}
        <div className="flex items-center justify-between text-[11px] text-t-secondary font-sans pt-1">
          <span>Global Edge Locations: <strong className="text-t-primary font-mono">14 Regions</strong></span>
          <span className="text-emerald-700 dark:text-[#00E599] font-mono font-bold">Cold start: 0ms</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 3. SYSTEM RELIABILITY & UPTIME CARD ──────────────────────────────────────
export function SystemReliabilityCard() {
  const regions = [
    { name: 'US-East (N. Virginia)', ping: '16ms', status: 'Operational' },
    { name: 'EU-Central (Frankfurt)', ping: '24ms', status: 'Operational' },
    { name: 'AP-Southeast (Singapore)', ping: '38ms', status: 'Operational' },
    { name: 'Global Database Cluster', ping: '8ms', status: 'Operational' },
  ];

  return (
    <FeatureCard
      title="System Reliability & Uptime"
      description="Monitor 99.99% service availability with synthetic health checks from 14 global edge locations."
    >
      <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-bdr">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Synthetic Uptime Monitoring
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-bold">
            99.99% Uptime
          </span>
        </div>

        {/* Heartbeat Uptime Bars */}
        <div className="bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-3.5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-sans">
            <span className="text-t-primary font-medium">30-Day Operational Heartbeat</span>
            <span className="text-emerald-700 dark:text-[#00E599] font-mono font-semibold">100% Passed</span>
          </div>
          <div className="grid grid-cols-30 gap-1 h-6 items-center">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="h-full bg-emerald-500 dark:bg-[#00E599] rounded-sm hover:opacity-80 transition-opacity"
                title={`Day ${i + 1}: 100% uptime`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-t-muted font-sans">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Global Edge Health List */}
        <div className="space-y-1.5">
          {regions.slice(0, 3).map((r) => (
            <div
              key={r.name}
              className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00E599]" />
                <span className="text-t-primary text-[11px] font-sans font-medium">{r.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-t-muted text-[10px]">{r.ping}</span>
                <span className="text-emerald-700 dark:text-[#00E599] text-[10px] font-semibold">{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FeatureCard>
  );
}
