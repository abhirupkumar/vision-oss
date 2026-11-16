import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  {
    name: 'PostHog',
    icon: '🦔',
    problem: "PostHog sees your clicks and funnels. But it has no idea what your GPT-4o call cost, how long it took, or which prompt template broke in production.",
    missing: ['LLM token tracking', 'AI cost attribution', 'Trace trees', 'Provider-level latency'],
  },
  {
    name: 'Langfuse',
    icon: '🔭',
    problem: "Langfuse is excellent for LLM tracing — but it's completely blind to your users. No session replays, no conversion funnels, no geographic data, no revenue.",
    missing: ['Session replays', 'Web vitals', 'Funnels & goals', 'Revenue tracking'],
  },
  {
    name: 'Datadog',
    icon: '🐕',
    problem: "Datadog was built for infrastructure, not AI products. It's expensive, complex, and completely unsuited for non-deterministic LLM pipelines and user-level analytics.",
    missing: ['LLM observability', 'Session replays', 'User journeys', 'Affordable pricing'],
  },
  {
    name: 'Mixpanel',
    icon: '📊',
    problem: "Mixpanel is a great event tracker — but it stops at your frontend. It can't see inside your AI pipelines, can't replay sessions, and has no concept of token costs.",
    missing: ['LLM tracing', 'Session replay', 'Error tracking', 'Backend observability'],
  },
];

export default function WhyNotJust() {
  const [active, setActive] = useState(0);
  const current = tools[active];

  return (
    <section className="py-24 bg-surface-bright border-t border-border-light overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        {/* 3-Column "Why Vision?" Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 bg-surface-white rounded-2xl border border-border-light p-8 shadow-sm overflow-hidden"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-label-xs uppercase tracking-widest text-primary mb-2 font-semibold">The Core Difference</p>
            <h3 className="font-headline-md text-2xl text-text-primary mb-3">
              Traditional analytics sees users. LLM tools see tokens. Vision connects both to revenue.
            </h3>
            <p className="text-sm text-text-secondary">
              Know what your users do, what your AI costs, and what makes you money.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Traditional Analytics */}
            <div className="p-6 rounded-xl bg-surface-subtle border border-border-light flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Traditional Analytics</div>
                <div className="text-sm font-semibold text-text-primary mb-4">Users &amp; Events</div>
                <ul className="space-y-2.5 text-xs text-text-secondary font-medium">
                  <li className="flex items-center gap-2"><span>•</span> Visitors &amp; Sessions</li>
                  <li className="flex items-center gap-2"><span>•</span> Custom Click Events</li>
                  <li className="flex items-center gap-2"><span>•</span> Conversion Funnels</li>
                  <li className="flex items-center gap-2"><span>•</span> Cohort Retention</li>
                </ul>
              </div>
              <div className="text-[11px] text-error font-medium mt-6 pt-4 border-t border-border-light flex items-center gap-1.5">
                <span>✗</span> No visibility into AI latency or model spend
              </div>
            </div>

            {/* LLM Observability */}
            <div className="p-6 rounded-xl bg-surface-subtle border border-border-light flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">LLM Observability</div>
                <div className="text-sm font-semibold text-text-primary mb-4">Traces &amp; Models</div>
                <ul className="space-y-2.5 text-xs text-text-secondary font-medium">
                  <li className="flex items-center gap-2"><span>•</span> Prompt &amp; Completion Traces</li>
                  <li className="flex items-center gap-2"><span>•</span> Token Volume (Input/Output)</li>
                  <li className="flex items-center gap-2"><span>•</span> TTFT &amp; Streaming Latency</li>
                  <li className="flex items-center gap-2"><span>•</span> Model Error Rates</li>
                </ul>
              </div>
              <div className="text-[11px] text-error font-medium mt-6 pt-4 border-t border-border-light flex items-center gap-1.5">
                <span>✗</span> No user session context or revenue attribution
              </div>
            </div>

            {/* Vision */}
            <div className="p-6 rounded-xl bg-primary/5 border-2 border-primary flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">ALL-IN-ONE</span>
              </div>
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Vision</div>
                <div className="text-sm font-bold text-text-primary mb-4">Full-Stack AI Analytics</div>
                <ul className="space-y-2.5 text-xs text-text-primary font-medium">
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Visitors &amp; Web Journeys</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> AI Usage &amp; Prompt Traces</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Model Cost Attribution ($)</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Revenue &amp; Unit Economics</li>
                </ul>
              </div>
              <div className="text-[11px] text-primary font-bold mt-6 pt-4 border-t border-primary/20 flex items-center gap-1.5">
                <span>✓</span> Traffic → Feature Usage → AI Costs → Revenue
              </div>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-label-xs uppercase tracking-widest text-primary mb-3 font-semibold">The comparison</p>
          <h2 className="font-headline-lg text-headline-lg text-text-primary max-w-2xl mb-4">
            Why can't I just use what I already have?
          </h2>
          <p className="text-body-md text-text-secondary max-w-xl">
            Every existing tool was built before the age of AI products. They see half the picture. Vision connects web traffic, LLM pipelines, and revenue.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: tool tabs */}
          <div className="flex flex-col gap-3">
            {tools.map((tool, i) => (
              <motion.button
                key={tool.name}
                onClick={() => setActive(i)}
                whileHover={{ x: 4 }}
                className={`text-left flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 ${
                  active === i
                    ? 'border-primary bg-surface-white shadow-sm'
                    : 'border-border-light bg-surface-white hover:border-primary/30'
                }`}
              >
                <span className="text-2xl">{tool.icon}</span>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${active === i ? 'text-primary' : 'text-text-primary'}`}>
                    {tool.name}
                  </div>
                  {active === i && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-text-secondary mt-0.5"
                    >
                      Click to see what's missing →
                    </motion.div>
                  )}
                </div>
                {active === i && (
                  <div className="flex gap-1">
                    {tool.missing.slice(0, 2).map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-semibold border border-error/20">
                        ✗
                      </span>
                    ))}
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Right: comparison card - Aceternity border beam style */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl border border-border-light bg-surface-white overflow-hidden shadow-lg"
            >
              {/* Animated border beam */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute h-[2px] w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent top-0"
                  animate={{ left: ['-33%', '133%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{current.icon}</span>
                  <div>
                    <div className="font-bold text-text-primary">{current.name}</div>
                    <div className="text-xs text-text-secondary">What it can't do for AI products</div>
                  </div>
                </div>

                <p className="text-body-md text-text-secondary mb-8 leading-relaxed border-l-2 border-primary/30 pl-4">
                  {current.problem}
                </p>

                <div className="mb-8">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-4">Blind spots</p>
                  <div className="grid grid-cols-2 gap-3">
                    {current.missing.map((m) => (
                      <div key={m} className="flex items-center gap-2 p-3 rounded-lg bg-error/5 border border-error/15">
                        <span className="text-error font-bold text-sm">✗</span>
                        <span className="text-sm text-text-secondary">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border-light">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-4">Vision covers all of this</p>
                  <div className="grid grid-cols-2 gap-3">
                    {current.missing.map((m) => (
                      <div key={m} className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
                        <span className="text-primary font-bold text-sm">✓</span>
                        <span className="text-sm text-text-primary font-medium">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
