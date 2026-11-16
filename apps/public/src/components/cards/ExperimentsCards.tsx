import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { FlaskConical, ToggleRight, Trophy, Zap } from 'lucide-react';

// ─── 1. AB TESTS CARD ────────────────────────────────────────────────────────
export function AbTestsCard() {
  return (
    <FeatureCard
      title="A/B Tests"
      description="Test UI variations, prompt templates, and pricing models with statistically sound conversion tracking."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Experiment: Prompt & CTA Variation
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-bold">
            🏆 Winner Detected
          </span>
        </div>

        {/* Variants Comparison */}
        <div className="space-y-3 my-2">
          {/* Variant A */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] space-y-2 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-t-primary font-sans">Variant A (Control)</span>
              <span className="text-t-secondary font-mono">8.4% conv</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/70 dark:bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: '42%' }} />
            </div>
            <div className="text-[10px] text-t-muted font-sans flex justify-between">
              <span>Original prompt template</span>
              <span>12,400 visitors</span>
            </div>
          </div>

          {/* Variant B (Winner) */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 relative overflow-hidden shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-t-primary flex items-center gap-2 font-sans">
                <span>Variant B (Challenger)</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-600 dark:bg-[#00E599] text-white dark:text-[#090D14] rounded-full font-bold">WINNER</span>
              </span>
              <span className="text-emerald-700 dark:text-[#00E599] font-bold font-mono text-sm">11.2% conv (+33.3% lift)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/70 dark:bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 dark:bg-[#00E599] rounded-full" style={{ width: '56%' }} />
            </div>
            <div className="text-[10px] text-t-secondary font-sans flex justify-between">
              <span>Dynamic prompt + Volt CTA</span>
              <span>12,410 visitors</span>
            </div>
          </div>
        </div>

        {/* Significance Bar */}
        <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent flex items-center justify-between text-[11px] font-sans">
          <span className="text-t-secondary flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00E599]" />
            Statistical Significance:
          </span>
          <span className="text-emerald-700 dark:text-[#00E599] font-bold font-mono">99.4% (p &lt; 0.01)</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. FEATURE FLAGS CARD ───────────────────────────────────────────────────
export function FeatureFlagsCard() {
  const [flags, setFlags] = useState([
    { id: 'gpt-4o-mini-rollout', name: 'GPT-4o Mini Rollout', target: '50% Beta Cohort', enabled: true },
    { id: 'new-pricing-modal', name: 'New Pricing Modal', target: '100% Global', enabled: true },
    { id: 'deepseek-r1-fallback', name: 'DeepSeek-R1 Fallback', target: 'Enterprise Only', enabled: false },
  ]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <FeatureCard
      title="Feature Flags"
      description="Deploy features gradually, target specific user cohorts, and toggle instant rollbacks with zero database lag."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <ToggleRight className="w-4 h-4 text-purple-600 dark:text-[#A78BFA]" />
            Targeted Rollout Flags
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-[#A78BFA] font-semibold font-mono">
            Zero Postgres Writes
          </span>
        </div>

        {/* Toggle List */}
        <div className="space-y-2.5 my-2">
          {flags.map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-2xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between shadow-xs"
            >
              <div>
                <div className="text-xs font-bold text-t-primary font-sans">{f.name}</div>
                <div className="text-[10px] text-t-muted mt-0.5">{f.target}</div>
              </div>

              {/* Interactive Toggle Button */}
              <button
                type="button"
                onClick={() => toggleFlag(f.id)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  f.enabled ? 'bg-emerald-600 dark:bg-[#00E599]' : 'bg-slate-200 dark:bg-white/[0.1]'
                }`}
              >
                <motion.div
                  layout
                  className={`w-4 h-4 rounded-full shadow-sm ${f.enabled ? 'bg-white dark:bg-[#090D14]' : 'bg-white'}`}
                  style={{
                    marginLeft: f.enabled ? 'auto' : '0',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Kafka stream indicator */}
        <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent flex items-center justify-between text-[11px] font-sans">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00E599]" />
            <span className="text-t-secondary">Telemetry Transport:</span>
          </div>
          <span className="text-t-primary font-mono font-bold">Kafka stream_type &lt;5ms</span>
        </div>
      </div>
    </FeatureCard>
  );
}
