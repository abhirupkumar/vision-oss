import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DASHBOARD_URL, SHOW_PAID_PLANS, DOCS_URL, GITHUB_URL } from '../lib/config';
import {
  Check,
  Zap,
  ShieldCheck,
  Sliders,
  TrendingDown,
  Activity,
  Video,
  AlertTriangle,
  Cpu,
  Split,
  Terminal,
  HelpCircle,
  BookOpen,
  Github,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Pricing Rate Card Math Helpers
function calculateEventsCost(count: number): number {
  if (count <= 0) return 0;
  let remaining = count;
  let cost = 0;
  const t1 = Math.min(remaining, 250000);
  cost += (t1 / 1000) * 0.4;
  remaining -= t1;
  if (remaining > 0) {
    const t2 = Math.min(remaining, 1750000);
    cost += (t2 / 1000) * 0.25;
    remaining -= t2;
  }
  if (remaining > 0) {
    const t3 = Math.min(remaining, 8000000);
    cost += (t3 / 1000) * 0.15;
    remaining -= t3;
  }
  if (remaining > 0) {
    cost += (remaining / 1000) * 0.08;
  }
  return cost;
}

function calculateReplaysCost(count: number): number {
  if (count <= 0) return 0;
  let remaining = count;
  let cost = 0;
  const t1 = Math.min(remaining, 5000);
  cost += (t1 / 1000) * 3.5;
  remaining -= t1;
  if (remaining > 0) {
    const t2 = Math.min(remaining, 20000);
    cost += (t2 / 1000) * 2.5;
    remaining -= t2;
  }
  if (remaining > 0) {
    cost += (remaining / 1000) * 1.5;
  }
  return cost;
}

function calculateErrorsCost(count: number): number {
  if (count <= 0) return 0;
  let remaining = count;
  let cost = 0;
  const t1 = Math.min(remaining, 50000);
  cost += (t1 / 1000) * 0.35;
  remaining -= t1;
  if (remaining > 0) {
    const t2 = Math.min(remaining, 200000);
    cost += (t2 / 1000) * 0.25;
    remaining -= t2;
  }
  if (remaining > 0) {
    const t3 = Math.min(remaining, 750000);
    cost += (t3 / 1000) * 0.18;
    remaining -= t3;
  }
  if (remaining > 0) {
    cost += (remaining / 1000) * 0.1;
  }
  return cost;
}

function calculateLlmCost(count: number): number {
  if (count <= 0) return 0;
  let remaining = count;
  let cost = 0;
  const t1 = Math.min(remaining, 50000);
  cost += (t1 / 1000) * 1.2;
  remaining -= t1;
  if (remaining > 0) {
    const t2 = Math.min(remaining, 450000);
    cost += (t2 / 1000) * 0.8;
    remaining -= t2;
  }
  if (remaining > 0) {
    cost += (remaining / 1000) * 0.4;
  }
  return cost;
}

export default function Pricing() {
  // Calculator state
  const [eventsK, setEventsK] = useState(100); // 100k events
  const [replays, setReplays] = useState(1000); // 1k replays
  const [errorsK, setErrorsK] = useState(20); // 20k errors
  const [llmK, setLlmK] = useState(10); // 10k LLM calls
  const [showCalculator, setShowCalculator] = useState(false);

  // Math
  const eventsCost = calculateEventsCost(eventsK * 1000);
  const replaysCost = calculateReplaysCost(replays);
  const errorsCost = calculateErrorsCost(errorsK * 1000);
  const llmCost = calculateLlmCost(llmK * 1000);
  const totalUsage = eventsCost + replaysCost + errorsCost + llmCost;

  const basePlan = 39.0;
  const includedCredit = 39.0;
  const creditUsed = Math.min(totalUsage, includedCredit);
  const overage = Math.max(0, totalUsage - includedCredit);
  const totalEstimatedPrice = basePlan + overage;

  // Competitor estimates for same volume
  const datadogEst = Math.round(150 + (eventsK * 0.8) + (replays * 0.01) + (llmK * 2.5));
  const posthogEst = Math.round(80 + (eventsK * 0.45) + (replays * 0.008) + (llmK * 1.8));

  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          {SHOW_PAID_PLANS ? (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold mb-4">
                <Zap size={14} /> Universal $39 Base Plan with Included Usage Credit
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-t-primary leading-tight">
                One Base Plan. Unlimited Products.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-400">
                  Draw down your $39 credit universally.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-t-secondary mt-4 leading-relaxed">
                Every dollar of your $39 base plan turns directly into universal usage credit across Web Analytics, Session Replays, Error Tracking, LLM Observability, and A/B Testing. MCP Server is 100% free.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open-Source Community Edition & Cloud Roadmap
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-t-primary leading-tight">
                100% Open-Source First.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-400">
                  Community Edition is free forever.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-t-secondary mt-4 leading-relaxed">
                Run Vision on your own infrastructure with Docker Compose. Complete data ownership, no telemetry limits, and zero vendor lock-in. Vision Cloud (Managed) is launching soon.
              </p>
            </>
          )}
        </motion.div>

        {!SHOW_PAID_PLANS ? (
          /* OSS First: Two-Column Plan Comparison (Community Edition Active + Cloud Coming Soon) */
          <div className="space-y-12 mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Community Edition Card (Active) */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="lg:col-span-6 relative rounded-3xl p-8 bg-bg-card border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between"
              >
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Available Now
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Vision Community Edition
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-black tracking-tight text-t-primary">$0</span>
                    <span className="text-base text-t-secondary font-medium">/ free forever (self-hosted)</span>
                  </div>
                  <p className="text-sm text-t-secondary mb-6 leading-relaxed">
                    Deploy on your own infrastructure with Docker Compose. Complete data ownership, no telemetry caps, and no monthly fees.
                  </p>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 mb-6 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-sm">
                      <ShieldCheck size={16} /> 100% Unmetered & Private
                    </div>
                    <div>Run PostgreSQL + ClickHouse on your own VPS or cluster. Direct database ingestion and Kafka buffering included.</div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'Unlimited Web Analytics, Pageviews & Custom Events',
                      'Session Replays with RRWeb streaming',
                      'Performance Monitoring & Web Vitals (LCP, INP, CLS)',
                      'ClickHouse & Tinybird storage architecture',
                      'High-Throughput Streaming via Kafka & Ingestion Worker',
                      'Funnels, Retention Cohorts, User Journeys & Distinct IDs',
                      'Full REST API & Developer SDKs (Browser JS & Python)',
                      '1-Command Docker Compose local cluster startup',
                    ].map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-t-primary">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <a
                    href={DOCS_URL + '/self-hosted'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-center transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center gap-2"
                  >
                    <BookOpen size={16} />
                    Deploy Community Edition
                  </a>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-6 rounded-2xl font-semibold text-xs text-center transition-all bg-bg-card border border-bdr text-t-secondary hover:text-t-primary flex items-center justify-center gap-2"
                  >
                    <Github size={15} />
                    Star on GitHub
                  </a>
                </div>
              </motion.div>

              {/* Vision Cloud Card (Coming Soon) */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="lg:col-span-6 relative rounded-3xl p-8 bg-bg-card border border-sky-500/30 shadow-xl flex flex-col justify-between"
              >
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Sparkles size={12} /> Coming Soon
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400 mb-1">
                    Vision Cloud (Managed)
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-black tracking-tight text-t-primary">$39</span>
                    <span className="text-base text-t-secondary font-medium">/ month (at launch)</span>
                  </div>
                  <p className="text-sm text-t-secondary mb-6 leading-relaxed">
                    Zero DevOps managed observability with live Customer Gross Margin, automated runaway bill-shock alerts, and universal credits.
                  </p>

                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300 mb-6 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-sm">
                      <Zap size={16} /> $39 Universal Usage Credit Included
                    </div>
                    <div>Every dollar of your $39 base fee converts directly into universal usage credit. No add-on fees or separate product tax.</div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'Live Customer Gross Margin Engine (Stripe/Paddle + LLM proxy)',
                      'Automated Runaway Bill-Shock Alerts on Slack & Discord',
                      'Statistical Anomaly Detection (Z-Score, EWMA, WoW baselines)',
                      'Cursor & Claude MCP Server Integration for AI coding IDEs',
                      'Global Multi-Region Edge Ingestion (<10ms global latency)',
                      'Automatic Schema Migrations, Tinybird Managed DB & zero maintenance',
                      'Configurable Monthly Spending Caps & Overuse Circuit Breakers',
                      'Enterprise SAML / SSO & Priority SLA Support',
                    ].map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-t-primary">
                        <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <div className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-center bg-slate-200/60 dark:bg-zinc-800/60 text-t-muted border border-border flex items-center justify-center gap-2 cursor-not-allowed">
                    <Sparkles size={16} className="text-sky-500" />
                    Cloud Edition — Launching Soon
                  </div>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-6 rounded-2xl font-semibold text-xs text-center transition-all bg-bg-card border border-bdr text-t-secondary hover:text-t-primary flex items-center justify-center gap-2"
                  >
                    <Github size={15} />
                    Star Repository for Cloud Launch Alerts
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Toggle Calculator Preview */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bg-card border border-bdr text-xs sm:text-sm font-semibold text-t-primary hover:border-sky-500/50 transition-all cursor-pointer shadow-sm"
              >
                <Sliders size={16} className="text-sky-500" />
                {showCalculator ? 'Hide Cloud Rate Card & Calculator' : 'Preview Cloud Usage Rate Card & Calculator'}
                {showCalculator ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        ) : null}

        {/* Pricing Architecture Bento (Shown when SHOW_PAID_PLANS is true OR when toggled via preview) */}
        {(SHOW_PAID_PLANS || showCalculator) && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left: Base Plan Card (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-5 relative rounded-3xl p-8 bg-bg-card border-2 border-sky-500/80 shadow-2xl shadow-sky-500/10 flex flex-col justify-between"
          >
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-sky-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              All-In-One Universal Plan
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-sky-600 dark:text-sky-400 mb-1">
                Vision Universal
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black tracking-tight text-t-primary">$39</span>
                <span className="text-base text-t-secondary font-medium">/ month</span>
              </div>
              <p className="text-sm text-t-secondary mb-6 leading-relaxed">
                Includes <span className="font-semibold text-t-primary">$39 in universal usage credit</span> every month. No separate product add-on fees.
              </p>

              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300 mb-6 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <ShieldCheck size={16} /> $39 Universal Credit Drawdown
                </div>
                <div>Your $39 base fee covers your first events, recordings, error spans, and LLM traces. You only pay progressive bracket rates once your $39 credit is depleted.</div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Full Web Analytics & Custom Events',
                  'Session Replays with RRWeb streaming',
                  'Full-stack Error Tracking & Stack traces',
                  'LLM Observability & Token Cost Guard',
                  'Automated Statistical Anomaly Detection',
                  'A/B Testing & Feature Flags engine',
                  'MCP Server Access (100% Free & Unlimited)',
                  'Unlimited team members & projects',
                  'Automated monthly MoR billing via Dodo Payments',
                  'Configurable Monthly Spending Cap & Overuse Pause',
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs text-t-primary">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={SHOW_PAID_PLANS ? DASHBOARD_URL : GITHUB_URL}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-center transition-all btn-brand-gradient shadow-lg block"
            >
              {SHOW_PAID_PLANS ? 'Start 7-Day Free Trial' : 'Star on GitHub'}
            </a>
          </motion.div>

          {/* Right: Interactive Bracket Calculator & Comparison (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-bg-card border border-bdr shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-sky-500" />
                  <h3 className="text-xl font-bold text-t-primary">Interactive Usage Calculator</h3>
                </div>
                <span className="text-xs text-t-muted">Simulate monthly usage</span>
              </div>
              <p className="text-xs text-t-secondary mb-6">
                Adjust the sliders below to see how the universal $39 credit absorbs your workload across all products.
              </p>

              {/* Sliders */}
              <div className="space-y-6 mb-8">
                {/* Events Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-t-primary flex items-center gap-1.5">
                      <Activity size={14} className="text-blue-400" /> Web Analytics Events
                    </span>
                    <span className="font-mono font-bold text-t-primary">
                      {eventsK.toLocaleString()}k events <span className="text-t-muted">(${eventsCost.toFixed(2)})</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={2000}
                    step={10}
                    value={eventsK}
                    onChange={(e) => setEventsK(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-zinc-800 accent-sky-500"
                  />
                </div>

                {/* Replays Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-t-primary flex items-center gap-1.5">
                      <Video size={14} className="text-purple-400" /> Session Replays
                    </span>
                    <span className="font-mono font-bold text-t-primary">
                      {replays.toLocaleString()} recordings <span className="text-t-muted">(${replaysCost.toFixed(2)})</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25000}
                    step={250}
                    value={replays}
                    onChange={(e) => setReplays(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-zinc-800 accent-sky-500"
                  />
                </div>

                {/* Errors Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-t-primary flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-400" /> Error Tracking
                    </span>
                    <span className="font-mono font-bold text-t-primary">
                      {errorsK.toLocaleString()}k errors <span className="text-t-muted">(${errorsCost.toFixed(2)})</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={10}
                    value={errorsK}
                    onChange={(e) => setErrorsK(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-zinc-800 accent-sky-500"
                  />
                </div>

                {/* LLM Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-t-primary flex items-center gap-1.5">
                      <Cpu size={14} className="text-sky-400" /> LLM Observability
                    </span>
                    <span className="font-mono font-bold text-t-primary">
                      {llmK.toLocaleString()}k traces <span className="text-t-muted">(${llmCost.toFixed(2)})</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={llmK}
                    onChange={(e) => setLlmK(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-zinc-800 accent-sky-500"
                  />
                </div>
              </div>

              {/* Drawdown Breakdown Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-bdr mb-6">
                <div className="flex justify-between items-center text-xs text-t-secondary mb-2">
                  <span>Gross Usage Spend across 4 products</span>
                  <span className="font-mono font-semibold text-t-primary">${totalUsage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-sky-600 dark:text-sky-400 font-medium mb-3">
                  <span>Universal Base Credit Applied</span>
                  <span className="font-mono font-bold">-${creditUsed.toFixed(2)}</span>
                </div>

                <div className="h-px bg-bdr mb-3" />

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-t-muted font-bold block">Total Monthly Cost</span>
                    <span className="text-xs text-t-muted">($39 Base Plan + ${overage.toFixed(2)} overage)</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-t-primary">
                    ${totalEstimatedPrice.toFixed(2)}
                    <span className="text-xs font-normal text-t-secondary">/mo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Comparison vs Datadog & PostHog */}
            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <TrendingDown className="text-sky-500 shrink-0" size={20} />
                <div className="text-xs">
                  <span className="font-bold text-t-primary block">Save 75%+ vs Fragmented Stacks</span>
                  <span className="text-t-secondary">Datadog: ~${datadogEst}/mo | PostHog: ~${posthogEst}/mo</span>
                </div>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600/20 text-sky-400 border border-emerald-500/30">
                MoR by Dodo Payments
              </div>
            </div>
          </motion.div>
        </div>

        {/* 6 Products Rate Card Overview */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center text-t-primary mb-2">Transparent Usage Rate Cards</h3>
          <p className="text-sm text-center text-t-secondary max-w-xl mx-auto mb-10">
            Progressive volume brackets ensure your effective unit price drops automatically as your traffic scales.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Events */}
            <div className="p-6 rounded-2xl bg-bg-card border border-bdr shadow-sm">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-t-primary">
                <Activity size={16} className="text-blue-400" />
                Web Analytics Events
              </div>
              <div className="space-y-1 text-xs text-t-secondary">
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>1st 250,000 events</span><span className="font-mono font-semibold text-t-primary">$0.40 / 1k</span></div>
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>250k – 2,000,000</span><span className="font-mono font-semibold text-t-primary">$0.25 / 1k</span></div>
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>2M – 10,000,000</span><span className="font-mono font-semibold text-t-primary">$0.15 / 1k</span></div>
                <div className="flex justify-between py-1"><span>10,000,000+</span><span className="font-mono font-semibold text-sky-500">$0.08 / 1k</span></div>
              </div>
            </div>

            {/* Card 2: Replays */}
            <div className="p-6 rounded-2xl bg-bg-card border border-bdr shadow-sm">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-t-primary">
                <Video size={16} className="text-purple-400" />
                Session Replay
              </div>
              <div className="space-y-1 text-xs text-t-secondary">
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>1st 5,000 recordings</span><span className="font-mono font-semibold text-t-primary">$3.50 / 1k</span></div>
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>5,000 – 25,000</span><span className="font-mono font-semibold text-t-primary">$2.50 / 1k</span></div>
                <div className="flex justify-between py-1"><span>25,000+</span><span className="font-mono font-semibold text-sky-500">$1.50 / 1k</span></div>
              </div>
            </div>

            {/* Card 3: Errors */}
            <div className="p-6 rounded-2xl bg-bg-card border border-bdr shadow-sm">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-t-primary">
                <AlertTriangle size={16} className="text-rose-400" />
                Error Tracking
              </div>
              <div className="space-y-1 text-xs text-t-secondary">
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>1st 50,000 errors</span><span className="font-mono font-semibold text-t-primary">$0.35 / 1k</span></div>
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>50,000 – 250,000</span><span className="font-mono font-semibold text-t-primary">$0.25 / 1k</span></div>
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>250k – 1,000,000</span><span className="font-mono font-semibold text-t-primary">$0.18 / 1k</span></div>
                <div className="flex justify-between py-1"><span>1,000,000+</span><span className="font-mono font-semibold text-sky-500">$0.10 / 1k</span></div>
              </div>
            </div>

            {/* Card 4: LLM */}
            <div className="p-6 rounded-2xl bg-bg-card border border-bdr shadow-sm">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-t-primary">
                <Cpu size={16} className="text-sky-400" />
                LLM Observability
              </div>
              <div className="space-y-1 text-xs text-t-secondary">
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>1st 50,000 calls</span><span className="font-mono font-semibold text-t-primary">$1.20 / 1k</span></div>
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>50,000 – 500,000</span><span className="font-mono font-semibold text-t-primary">$0.80 / 1k</span></div>
                <div className="flex justify-between py-1"><span>500,000+</span><span className="font-mono font-semibold text-sky-500">$0.40 / 1k</span></div>
              </div>
            </div>

            {/* Card 5: A/B Testing */}
            <div className="p-6 rounded-2xl bg-bg-card border border-bdr shadow-sm">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-t-primary">
                <Split size={16} className="text-amber-400" />
                A/B Testing & Experiments
              </div>
              <div className="space-y-1 text-xs text-t-secondary">
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>Per 10,000 sessions</span><span className="font-mono font-semibold text-t-primary">$1.00</span></div>
                <div className="pt-2 text-[11px] text-t-muted">Full multi-armed bandit, conversion funnels & variance tracking included.</div>
              </div>
            </div>

            {/* Card 6: MCP Server */}
            <div className="p-6 rounded-2xl bg-bg-card border border-sky-500/40 shadow-sm bg-sky-500/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-t-primary">
                  <Terminal size={16} className="text-sky-500" />
                  MCP Server Protocol
                </div>
                <span className="text-xs font-bold text-sky-500 uppercase">Free</span>
              </div>
              <div className="space-y-1 text-xs text-t-secondary">
                <div className="flex justify-between py-1 border-b border-bdr/50"><span>Cursor / Windsurf / Claude</span><span className="font-mono font-bold text-sky-400">$0.00</span></div>
                <div className="pt-2 text-[11px] text-t-muted">Unlimited real-time LLM context tools for AI coding assistants. Included on Base Plan.</div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-center text-t-primary mb-8 flex items-center justify-center gap-2">
            <HelpCircle size={20} className="text-sky-500" /> Frequently Asked Questions
          </h3>

          <div className="space-y-4 text-sm">
            <div className="p-5 rounded-2xl bg-bg-card border border-bdr">
              <h4 className="font-semibold text-t-primary mb-1">How does the $39 universal credit drawdown work?</h4>
              <p className="text-xs text-t-secondary leading-relaxed">
                Your monthly $39 fee is not an empty platform access tax. It immediately becomes $39 in universal usage credit. If you generate $15 in events, $10 in error tracking, and $14 in LLM calls, your total usage spend is $39.00 and you owe exactly $0 in overages!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-bg-card border border-bdr">
              <h4 className="font-semibold text-t-primary mb-1">What happens if my billing cycle ends with an unpaid bill?</h4>
              <p className="text-xs text-t-secondary leading-relaxed">
                If payment fails upon cycle renewal, Vision enforces an ingestion and dashboard lock. Client trackers cease sending data to prevent debt accumulation, and access can be instantly restored by updating payment methods in the Dodo Payments customer portal.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-bg-card border border-bdr">
              <h4 className="font-semibold text-t-primary mb-1">Can I prevent unexpected overages with a spending cap?</h4>
              <p className="text-xs text-t-secondary leading-relaxed">
                Yes. Inside Settings &gt; Billing, you can set a custom monthly spending cap (e.g. $100) and choose "Pause tracking on cap". Tracking will automatically pause if the cap is reached, guaranteeing zero surprise charges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
