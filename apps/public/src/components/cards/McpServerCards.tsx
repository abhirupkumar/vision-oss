import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { Search, Plus, ArrowUp, Sparkles, Terminal, FileText, Code2, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

// ─── 1. ROBUST MCP SERVER CARD (Matching the uploaded BetterStack screenshot) ──
export function McpTerminalCard() {
  const [activePrompt, setActivePrompt] = useState('Was there an increase in Shopify-related errors in the last 24 hours');
  const [response, setResponse] = useState<string | null>(
    'Shopify webhook errors spiked by 14% between 02:00-03:30 UTC due to API rate limits. 34 failed payments were automatically queued and successfully retried.'
  );
  const [isTyping, setIsTyping] = useState(false);

  const chipSuggestions = [
    { label: 'Write', icon: <FileText className="w-3.5 h-3.5" />, query: 'Write an executive summary of our AI gross margin this week' },
    { label: 'Learn', icon: <BookOpen className="w-3.5 h-3.5" />, query: 'Explain why cost-to-serve (CTS) dropped after prompt caching' },
    { label: 'Code', icon: <Code2 className="w-3.5 h-3.5" />, query: 'Generate Cursor MCP config snippet for @vision/mcp' },
    { label: 'Life stuff', icon: <Sparkles className="w-3.5 h-3.5" />, query: 'What was our best performing customer cohort today?' },
  ];

  const handleSelectChip = (query: string) => {
    setActivePrompt(query);
    setIsTyping(true);
    setResponse(null);
    setTimeout(() => {
      setIsTyping(false);
      setResponse(
        query.includes('gross margin')
          ? 'AI Gross Margin stands at 62.4% (+$8,012 net profit). Enterprise customers average 82% margin.'
          : query.includes('cost-to-serve')
          ? 'Prompt caching on GPT-4o saved 5.2M input tokens today, reducing daily CTS by 18% to $0.014/user.'
          : 'Added @vision/mcp with stdio transport. 6 live observability tools ready for Claude and Cursor.'
      );
    }, 600);
  };

  return (
    <FeatureCard
      title="Robust MCP server"
      description="Integrate your logs, metrics, traces, and errors into your existing LLM workflows with a top tier MCP server."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between items-center relative overflow-hidden text-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Top Greeting Headline */}
        <div className="flex items-center gap-2 pt-2 relative z-10">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-[#00E599]" />
          <h4 className="text-xl md:text-2xl font-serif tracking-tight text-t-primary">
            How was your day, Mike?
          </h4>
        </div>

        {/* Center Floating Input Prompt Box */}
        <div className="w-full max-w-lg bg-white dark:bg-[#0B1017]/85 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl relative z-10 space-y-3">
          <div className="text-left text-xs md:text-sm text-t-primary px-1 font-medium select-none">
            {activePrompt}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-t-secondary border border-slate-200/60 dark:border-transparent flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs text-t-primary border border-slate-200/60 dark:border-transparent font-medium transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-purple-600 dark:text-[#A78BFA]" />
                <span>Research</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelectChip(activePrompt)}
              className="w-8 h-8 rounded-lg btn-brand-gradient text-white flex items-center justify-center font-bold hover:opacity-95 transition-all shadow-xs"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Live Answer or Typing indicator */}
        <div className="min-h-[42px] px-4 flex items-center justify-center text-xs text-t-secondary relative z-10 max-w-md">
          {isTyping ? (
            <div className="flex items-center gap-1 text-emerald-700 dark:text-[#00E599]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00E599] animate-ping" />
              <span>Querying live telemetry via @vision/mcp...</span>
            </div>
          ) : (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-t-secondary">
              {response}
            </p>
          )}
        </div>

        {/* Bottom Floating Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 relative z-10 pb-1">
          {chipSuggestions.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSelectChip(chip.query)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.05] text-xs text-t-secondary hover:text-t-primary transition-all shadow-xs"
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. GET AN AI SRE CARD (Matching second card in BetterStack screenshot) ───
export function McpClientsCard() {
  return (
    <FeatureCard
      title="Get an AI SRE"
      description="Claude Code-like UI with the knowledge of your infrastructure, costs, and customer journeys."
    >
      <div className="w-full h-full p-6 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Floating Log Inspection Card */}
        <div className="w-full max-w-md bg-white dark:bg-[#0B1017]/85 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl space-y-3 relative z-10">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-[#A78BFA]">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-left font-mono">
                <div className="text-xs font-semibold text-t-primary flex items-center gap-1.5">
                  <span className="text-emerald-700 dark:text-[#00E599] font-bold">[INFO]</span> 10.244.0.12:51944
                </div>
                <div className="text-[10px] text-t-muted">Log line · nginx-ingress-controller</div>
              </div>
            </div>

            <button
              type="button"
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-medium text-t-secondary hover:text-t-primary border border-slate-200/60 dark:border-transparent transition-colors"
            >
              Attach
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent text-left font-mono text-[11px] text-t-secondary leading-relaxed">
            Investigate the attached nginx logs for high latency upstream requests during traffic spike.
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-t-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00E599]" />
              Correlated with Stripe payment drops
            </span>
            <span className="text-purple-700 dark:text-[#A78BFA] font-mono text-[11px] font-semibold">24ms resolve</span>
          </div>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 3. OBSERVABILITY TOOLS CARD (Matching third card in screenshot) ──────────
export function McpToolsCard() {
  const incidents = [
    { title: 'AI Cost Spike Alert Avoided', desc: 'Auto-switched from GPT-4o to Claude 3.5 Sonnet', time: '2m ago', badge: 'Resolved' },
    { title: 'Checkout Latency Spike', desc: 'Upstream gateway latency > 500ms for 48 sessions', time: '14m ago', badge: 'Mitigated' },
    { title: 'Negative Margin User Detected', desc: 'User token consumption exceeded monthly tier rev', time: '1h ago', badge: 'Auto-throttled' },
  ];

  return (
    <FeatureCard
      title="Smart incident merging"
      description="Correlate model errors, customer margin anomalies, and traffic spikes into actionable root causes."
    >
      <div className="w-full h-full p-6 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-purple-500/8 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-md bg-white dark:bg-[#0B1017]/85 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl space-y-2.5 relative z-10">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-t-primary uppercase tracking-wider">
              Live Incidents & AI Guard
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-mono font-semibold">
              3 Monitored
            </span>
          </div>

          <div className="space-y-2">
            {incidents.map((inc) => (
              <div
                key={inc.title}
                className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent flex items-center justify-between text-left text-xs"
              >
                <div>
                  <div className="font-semibold text-t-primary text-[11px]">{inc.title}</div>
                  <div className="text-[10px] text-t-secondary mt-0.5">{inc.desc}</div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#00E599] font-mono font-semibold shrink-0 ml-2">
                  {inc.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureCard>
  );
}
