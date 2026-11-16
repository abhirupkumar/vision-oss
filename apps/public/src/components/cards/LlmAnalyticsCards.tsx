import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { Cpu, Zap, DollarSign, ShieldAlert } from 'lucide-react';

// ─── 1. AI MODELS USED CARD ──────────────────────────────────────────────────
export function AiModelsUsedCard() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const models = [
    { name: 'GPT-4o', latency: '310ms', cost: '$0.005/1k', score: '96%', calls: '48.2k', badge: 'Best Reasoner', color: 'text-emerald-700 dark:text-[#00E599]' },
    { name: 'Claude 3.5 Sonnet', latency: '240ms', cost: '$0.003/1k', score: '98%', calls: '32.1k', badge: 'Top Accuracy', color: 'text-purple-700 dark:text-[#A78BFA]' },
    { name: 'Gemini 2.0 Flash', latency: '145ms', cost: '$0.001/1k', score: '93%', calls: '64.0k', badge: 'Ultra Fast', color: 'text-sky-700 dark:text-[#38BDF8]' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % models.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const cur = models[selectedIdx];

  return (
    <FeatureCard
      title="AI Models Used"
      description="Benchmark inference across OpenAI, Anthropic, and Google. Track latency (TTFT), error rates, and model quality."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header tabs */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Multi-Model Observability
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-semibold">
            {cur.badge}
          </span>
        </div>

        {/* Model Selector Pills */}
        <div className="grid grid-cols-3 gap-2 my-2">
          {models.map((m, i) => (
            <button
              key={m.name}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={`p-2.5 rounded-xl text-center text-xs transition-all ${
                selectedIdx === i
                  ? 'bg-emerald-600 dark:bg-[#00E599] text-white dark:text-[#090D14] font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.04] text-t-secondary hover:text-t-primary border border-slate-200/60 dark:border-transparent'
              }`}
            >
              {m.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Active Model Benchmark Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={cur.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] rounded-2xl p-4 space-y-3 my-1 shadow-xs"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="text-t-primary font-bold text-sm">{cur.name}</span>
              <span className="text-t-muted text-[11px]">{cur.calls} calls today</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent p-2.5 rounded-xl">
                <span className="text-[10px] text-t-muted uppercase block font-sans">TTFT Latency</span>
                <span className="text-sm font-bold text-t-primary">{cur.latency}</span>
              </div>
              <div className="bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent p-2.5 rounded-xl">
                <span className="text-[10px] text-t-muted uppercase block font-sans">Avg Cost</span>
                <span className="text-sm font-bold text-t-primary">{cur.cost}</span>
              </div>
              <div className="bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent p-2.5 rounded-xl">
                <span className="text-[10px] text-t-muted uppercase block font-sans">Eval Score</span>
                <span className={`text-sm font-bold ${cur.color}`}>{cur.score}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Fallback indicator */}
        <div className="flex items-center justify-between text-[11px] text-t-secondary pt-1 font-sans">
          <span>Routing: <strong className="text-t-primary font-mono">Dynamic fallback active</strong></span>
          <span className="text-emerald-700 dark:text-[#00E599] font-semibold font-mono">0.00% timeouts</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. NO OF TOKENS USED CARD ───────────────────────────────────────────────
export function NoOfTokensCard() {
  const [tokens, setTokens] = useState(48210450);
  const tokenBreakdown = [
    { label: 'Prompt Input', val: '28.4M', pct: 58, color: 'bg-emerald-500 dark:bg-[#00E599]' },
    { label: 'Completion Output', val: '14.6M', pct: 30, color: 'bg-purple-600 dark:bg-[#8B5CF6]' },
    { label: 'Prompt Caching', val: '5.2M', pct: 12, color: 'bg-sky-500 dark:bg-[#38BDF8]' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTokens((prev) => prev + Math.floor(Math.random() * 850) + 150);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <FeatureCard
      title="No of Tokens Used"
      description="Track token consumption velocity across input, output, and cached prompt tokens with real-time spike detection."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Token Counter Widget */}
        <div className="bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-4 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center text-[10px] text-t-muted uppercase font-sans">
            <span>Total Token Volume</span>
            <span className="text-emerald-700 dark:text-[#00E599] font-semibold font-mono">+3,200/sec</span>
          </div>
          <motion.div
            key={tokens}
            className="text-3xl font-bold text-t-primary my-1"
          >
            {(tokens / 1000000).toFixed(2)}M
          </motion.div>
          <div className="text-[11px] text-emerald-700 dark:text-[#00E599] flex items-center gap-1 font-semibold font-sans">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Prompt caching saved $124.80 today</span>
          </div>
        </div>

        {/* Animated Stacked Bar */}
        <div className="my-2 space-y-2">
          <div className="h-3 w-full bg-slate-200/70 dark:bg-white/[0.05] rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 dark:bg-[#00E599] h-full transition-all" style={{ width: '58%' }} />
            <div className="bg-purple-600 dark:bg-[#8B5CF6] h-full transition-all" style={{ width: '30%' }} />
            <div className="bg-sky-500 dark:bg-[#38BDF8] h-full transition-all" style={{ width: '12%' }} />
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            {tokenBreakdown.map((t) => (
              <div key={t.label} className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-2 text-t-secondary font-sans">
                  <span className={`w-2 h-2 rounded-full ${t.color}`} />
                  {t.label}
                </span>
                <span className="text-t-primary font-bold">{t.val} ({t.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rate limit warning status */}
        <div className="flex items-center justify-between text-[11px] text-t-secondary pt-1 font-sans">
          <span>Tier Rate Limit: <strong className="text-t-primary font-mono">25% capacity</strong></span>
          <span className="text-emerald-700 dark:text-[#00E599] font-semibold font-mono">Healthy</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 3. COSTS PER USER CARD ──────────────────────────────────────────────────
export function CostsPerUserCard() {
  const users = [
    { email: 'alex@acme.com', tokens: '184k', cost: '$62.40', cts: '$0.021', tier: 'Pro' },
    { email: 'sarah@hyper.io', tokens: '142k', cost: '$48.20', cts: '$0.016', tier: 'Pro' },
    { email: 'dev@novastack.ai', tokens: '98k', cost: '$31.80', cts: '$0.011', tier: 'Starter' },
    { email: 'team@zenith.co', tokens: '64k', cost: '$22.50', cts: '$0.008', tier: 'Enterprise' },
  ];

  return (
    <FeatureCard
      title="Costs per user"
      description="Attribute every dollar of LLM inference spend to individual customer accounts, teams, and API keys."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Per-User AI Cost Attribution
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#00E599] font-semibold">
            CTS: $0.014/user
          </span>
        </div>

        {/* User Cost Table */}
        <div className="space-y-1.5 my-2">
          <div className="grid grid-cols-4 text-[10px] text-t-muted uppercase pb-1 font-sans font-semibold">
            <span className="col-span-2">User</span>
            <span className="text-right">Tokens</span>
            <span className="text-right">Cost</span>
          </div>

          {users.map((u) => (
            <div
              key={u.email}
              className="grid grid-cols-4 items-center text-xs p-2.5 rounded-xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] shadow-xs"
            >
              <div className="col-span-2 flex items-center gap-1.5 truncate">
                <span className="text-t-primary font-medium truncate text-[11px]">{u.email}</span>
              </div>
              <span className="text-right text-t-secondary text-[11px]">{u.tokens}</span>
              <span className="text-right text-emerald-700 dark:text-[#00E599] font-bold text-[11px]">{u.cost}</span>
            </div>
          ))}
        </div>

        {/* Cost Spike Guard Notification */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-[11px] font-sans">
          <span className="text-emerald-700 dark:text-[#00E599] font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Cost Spike Anomaly Guard Active
          </span>
          <span className="text-t-secondary text-[10px] font-mono">No overages</span>
        </div>
      </div>
    </FeatureCard>
  );
}
