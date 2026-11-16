import React from 'react';
import { motion } from 'framer-motion';

export default function ValueProps() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const props = [
    {
      icon: 'touch_app',
      color: 'text-primary',
      title: 'Visitor Tracking',
      desc: 'Pageviews, sessions, conversion funnels, user journeys, retention, and session replays without heavy SDKs.'
    },
    {
      icon: 'auto_awesome',
      color: 'text-[#F7941D]',
      title: 'AI Cost Tracking',
      desc: 'Full prompt traces, Time-To-First-Token (TTFT) latency, token volume, and cost-to-serve (CTS) across models.'
    },
    {
      icon: 'payments',
      color: 'text-primary',
      title: 'Revenue Analytics',
      desc: 'Attribute Stripe and Paddle subscriptions to individual users. Measure Gross Margin per User in real time.'
    },
    {
      icon: 'trending_up',
      color: 'text-secondary',
      title: 'Unit Economics',
      desc: 'Track AI ROI ratios, customer payback periods, and identify which customer cohorts drive true profitability.'
    },
    {
      icon: 'bug_report',
      color: 'text-primary',
      title: 'Errors & Performance',
      desc: 'Catch rate limits, model timeouts, token anomalies, and Core Web Vitals regressions with zero guesswork.'
    },
    {
      icon: 'smart_toy',
      color: 'text-[#F7941D]',
      title: 'Ask AI via MCP Server',
      desc: 'Connect Claude Desktop, Cursor, and AI agents directly to Vision to inspect live business health.'
    }
  ];

  return (
    <section className="py-24 bg-surface border-t border-border-light">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 text-primary mb-4">
            <div className="w-6 h-1 bg-primary rounded-full"></div>
            <div className="w-3 h-1 bg-primary/40 rounded-full"></div>
          </div>
          <h2 className="font-headline-lg text-headline-lg mb-4 text-text-primary">
            Observe your product, track AI costs, and protect your margins.
          </h2>
          <p className="text-text-secondary max-w-2xl">
            The AI Business Observability Platform. Connect product behavior, model inference telemetry, and financial outcomes in one unified platform.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-gutter"
        >
          {props.map((prop, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className={`p-8 border border-border-light rounded-xl transition-colors group bg-surface-white hover:border-current ${prop.color}`}
            >
              <span className={`material-symbols-outlined mb-6 text-[32px] ${prop.color}`}>{prop.icon}</span>
              <h4 className="font-headline-md text-headline-md mb-4 text-text-primary">{prop.title}</h4>
              <p className="text-text-secondary font-body-sm">{prop.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
