import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { Calculator, BarChart4, TrendingUp, ShieldCheck } from 'lucide-react';

// ─── 1. PER USER PROFIT CARD ─────────────────────────────────────────────────
export function PerUserProfitCard() {
  const [tokensPerCall, setTokensPerCall] = useState(2400);

  // Live calculation: Pro plan $99/mo, 1000 calls/mo
  const userRevenue = 99.00;
  const aiCostPerThousand = 0.003; // $0.003 per 1k tokens
  const totalAiCost = parseFloat(((tokensPerCall / 1000) * 1000 * aiCostPerThousand).toFixed(2));
  const netProfit = parseFloat((userRevenue - totalAiCost).toFixed(2));
  const profitMargin = ((netProfit / userRevenue) * 100).toFixed(1);

  return (
    <FeatureCard
      title="Per user profit"
      description="Calculate exact customer profitability in real time: Net Profit = User Revenue − User AI Cost."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Unit Economics Formula
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-bold">
            {profitMargin}% Gross Margin
          </span>
        </div>

        {/* Live Equation Box */}
        <div className="bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-4 rounded-2xl space-y-3 my-1 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-t-secondary font-sans">Customer Subscription (Rev):</span>
            <span className="text-t-primary font-bold text-sm">${userRevenue.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-700 dark:text-[#A78BFA] font-sans flex items-center gap-1">
              <span>−</span> User AI Inference Cost:
            </span>
            <span className="text-purple-700 dark:text-[#A78BFA] font-bold text-sm">−${totalAiCost.toFixed(2)}</span>
          </div>

          <div className="h-px bg-bdr" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700 dark:text-[#00E599] font-bold font-sans">Net Customer Profit:</span>
            <span className="text-emerald-700 dark:text-[#00E599] font-bold text-lg">+${netProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Interactive Slider simulation */}
        <div className="space-y-1.5 bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent p-3 rounded-xl">
          <div className="flex justify-between items-center text-[10px] text-t-secondary font-sans">
            <span>Simulate Prompt Optimization (Tokens/call):</span>
            <strong className="text-t-primary font-mono">{tokensPerCall} tokens</strong>
          </div>
          <input
            type="range"
            min={800}
            max={5000}
            step={200}
            value={tokensPerCall}
            onChange={(e) => setTokensPerCall(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-t-muted font-sans">
            <span>Tight Prompt (800)</span>
            <span>Unoptimized (5k)</span>
          </div>
        </div>

        {/* Bottom takeaway */}
        <div className="text-[11px] text-t-secondary pt-1 font-sans flex justify-between">
          <span>AI Cost Burden: <strong className="text-purple-700 dark:text-[#A78BFA] font-mono">{((totalAiCost/userRevenue)*100).toFixed(1)}%</strong></span>
          <span className="text-emerald-700 dark:text-[#00E599] font-semibold font-mono">Highly Profitable</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. KPI SCORECARD CARD ───────────────────────────────────────────────────
export function KpiScorecardCard() {
  const kpis = [
    { label: 'AI Gross Margin', val: '62.4%', trend: '▲ +3.1%', sub: 'Target: >60%' },
    { label: 'AI ROI Multiplier', val: '4.1×', trend: '▲ +0.4x', sub: '$4.10 rev per $1 AI' },
    { label: 'Cost to Serve (CTS)', val: '$0.014', trend: '▼ -12%', sub: 'Per user / day' },
    { label: 'Payback Period', val: '38 Days', trend: '▼ -8d', sub: 'CAC + AI payback' },
  ];

  return (
    <FeatureCard
      title="KPI Scorecard"
      description="Monitor vital AI business health indicators: Gross Margins, AI ROI multiplier, Cost-to-Serve, and Payback periods."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <BarChart4 className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Executive Observability Scorecard
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-bold">
            Health: 98/100
          </span>
        </div>

        {/* 4 Quadrants Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-2">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-3.5 rounded-2xl flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="text-[10px] text-t-muted font-sans font-medium line-clamp-1">{k.label}</div>
                <div className="text-2xl font-bold text-t-primary my-1">{k.val}</div>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-emerald-700 dark:text-[#00E599] font-semibold">{k.trend}</span>
                <span className="text-t-muted">{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Benchmark pill */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-[11px] font-sans flex items-center justify-between">
          <span className="text-t-primary font-medium">B2B SaaS Benchmark:</span>
          <span className="text-emerald-700 dark:text-[#00E599] font-bold font-mono">Top 5th Percentile</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 3. PROFIT MARGINS CARD ──────────────────────────────────────────────────
export function ProfitMarginsCard() {
  const tiers = [
    { tier: 'Enterprise Plan', margin: 82, rev: '$42k', cost: '$7.5k', color: 'bg-emerald-500 dark:bg-[#00E599]' },
    { tier: 'Pro Subscription', margin: 68, rev: '$28k', cost: '$8.9k', color: 'bg-purple-600 dark:bg-[#8B5CF6]' },
    { tier: 'Starter Tier', margin: 44, rev: '$12k', cost: '$6.7k', color: 'bg-sky-500 dark:bg-[#38BDF8]' },
  ];

  return (
    <FeatureCard
      title="Profit Margins"
      description="Detect unprofitable users before they drain your balance. Set margin protection thresholds across all subscription tiers."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-[#A78BFA]" />
            Tier Margin Protection
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-bold">
            Zero Negative Cohorts
          </span>
        </div>

        {/* Margin tier bars */}
        <div className="space-y-3.5 my-2">
          {tiers.map((t) => (
            <div key={t.tier} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-t-primary font-sans font-medium text-xs">{t.tier}</span>
                <span className="font-bold text-t-primary">{t.margin}% margin</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/70 dark:bg-white/[0.05] rounded-full overflow-hidden flex">
                <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.margin}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-t-muted">
                <span>Rev: {t.rev}</span>
                <span>AI Spend: {t.cost}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Margin Threshold Guard Alert */}
        <div className="p-3 rounded-xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-sans shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            <span className="text-t-secondary">Margin Floor Trigger:</span>
          </div>
          <span className="text-t-primary font-mono font-bold">Auto-throttle at &lt;20%</span>
        </div>
      </div>
    </FeatureCard>
  );
}
