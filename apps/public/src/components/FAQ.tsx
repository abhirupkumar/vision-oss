import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the MCP server work?',
    a: 'The Vision MCP server runs locally via npx and connects to Claude Desktop, Cursor, or any MCP-compatible AI client via stdio. It exposes 6 tools that query your live Vision data — unit economics, revenue by user, LLM costs, experiment metrics, errors, and your AI business scorecard.'
  },
  {
    q: 'How is LLM cost tracking set up?',
    a: 'You route your AI API calls through Vision\'s lightweight proxy or add a single SDK call after each LLM response. We capture model, tokens, cost, latency, and link it to the active user session automatically.'
  },
  {
    q: 'Does Vision replace Mixpanel, Amplitude or PostHog?',
    a: 'Vision handles product analytics, LLM observability, revenue analytics, unit economics, and experiments in one place — with much less overhead. If you\'re already paying for several tools, Vision likely replaces all of them at a lower cost.'
  },
  {
    q: 'What is "per-user AI gross margin"?',
    a: 'It\'s the net revenue you earn from each user minus the AI inference costs you incur to serve them. Formula: (Revenue per User − AI Cost per User) / Revenue per User × 100. Vision computes this in real time by joining your Stripe/Paddle revenue with your LLM usage telemetry.'
  },
  {
    q: 'Is Vision GDPR and CCPA compliant?',
    a: 'Yes. Vision is fully GDPR and CCPA compliant. You control data residency, user deletion, and consent. We never sell your data and you own it completely.'
  },
  {
    q: 'Can I keep A/B tests and feature flags out of Postgres?',
    a: 'Yes — Vision\'s experiment and feature flag events are routed directly to Kafka (telemetry topic) and aggregated in Tinybird. Zero Postgres writes for experimentation, which keeps your primary database lean and fast.'
  },
  {
    q: 'What integrations are supported?',
    a: 'Stripe, Paddle, OpenAI, Anthropic, Google Gemini, OpenRouter, LangChain, Vercel, Supabase, Clerk, Resend, Next.js, and any REST API. The SDK is framework-agnostic.'
  },
];

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-bdr">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-base font-semibold text-t-primary">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={`w-5 h-5 ${open ? 'text-emerald-600 dark:text-[#00E599]' : 'text-t-muted'} shrink-0`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-t-secondary text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-24 border-t border-bdr">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] text-[11px] sm:text-xs font-semibold mb-4 sm:mb-5">
              ❓  Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-[38px] md:text-[44px] font-bold tracking-tight leading-[1.15] text-t-primary mb-3 sm:mb-4">
              Common questions.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-t-secondary">
              Can't find your answer?{' '}
              <a href="#" className="text-emerald-700 dark:text-[#00E599] hover:underline font-medium">Chat with us</a>.
            </p>
          </div>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
