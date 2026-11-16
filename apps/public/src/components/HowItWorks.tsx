import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Aceternity-style glowing code block
const CODE_STEPS = [
  {
    label: '1. Install',
    lang: 'bash',
    code: `npm install @vision/browser`,
  },
  {
    label: '2. Init once',
    lang: 'tsx',
    code: `import { init } from '@vision/browser';

// In your root layout
init({
  projectId: 'proj_live_xxxx',
  autoTrack: true,    // pageviews + clicks
  performance: true,  // Core Web Vitals
  sessionReplay: true // rrweb recording
});`,
  },
  {
    label: '3. Track LLMs via Proxy',
    lang: 'typescript',
    code: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.visionanalytics.com/llm-proxy/openai/v1',
  defaultHeaders: {
    'X-Vision-Project': 'proj_live_xxxx',
  },
});

// Call model normally — tokens, cost, latency tracked with ~0ms delay!
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Generate report' }],
});`,
  },
];

function CodeLine({ line, index, animate }: { line: string; index: number; animate: boolean }) {
  const isComment = line.trim().startsWith('//') || line.trim().startsWith('#');
  const isKeyword = /^(import|from|const|async|await|return|export|function)/.test(line.trim());
  const isString = line.includes("'") || line.includes('"') || line.includes('`');

  let cls = 'text-text-secondary';
  if (isComment) cls = 'text-text-secondary/50 italic';
  else if (isKeyword) cls = 'text-[#F1592A]';
  else if (isString) cls = 'text-[#8c4f00]';

  return (
    <motion.div
      initial={animate ? { opacity: 0, x: -8 } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
      className={`leading-6 ${cls} font-mono text-[13px] whitespace-pre`}
    >
      {line || ' '}
    </motion.div>
  );
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const handleStep = (i: number) => {
    setActiveStep(i);
    setAnimKey((k) => k + 1);
  };

  return (
    <section className="py-24 bg-surface-bright border-t border-border-light overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <p className="text-label-xs uppercase tracking-widest text-primary mb-3 font-semibold">Setup</p>
            <h2 className="font-headline-lg text-headline-lg text-text-primary max-w-xl">
              From zero to full observability<br />in three lines.
            </h2>
          </div>
          <p className="text-body-md text-text-secondary max-w-sm">
            Zero-latency streaming proxy. No SDK bloat. Works with OpenAI, Anthropic, Gemini, and more.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Step tabs */}
          <div className="flex flex-col gap-3">
            {CODE_STEPS.map((step, i) => (
              <motion.button
                key={i}
                onClick={() => handleStep(i)}
                whileHover={{ x: 4 }}
                className={`text-left p-6 rounded-xl border transition-all duration-200 ${activeStep === i
                    ? 'border-primary bg-surface-white shadow-sm shadow-primary/10'
                    : 'border-border-light bg-surface-white hover:border-primary/30'
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${activeStep === i ? 'bg-primary text-white' : 'bg-surface-subtle text-text-secondary'
                    }`}>
                    {i + 1}
                  </div>
                  <span className={`font-semibold text-sm ${activeStep === i ? 'text-primary' : 'text-text-secondary'}`}>
                    {step.label}
                  </span>
                </div>
                {activeStep === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-body-sm text-text-secondary ml-9"
                  >
                    {i === 0 && 'One package for everything — browser analytics, replays, web vitals, and error tracking.'}
                    {i === 1 && 'Call init() once in your root layout. No config files, no build plugins, no complex setup.'}
                    {i === 2 && 'Point your provider baseURL to Vision. Streaming chunks pass through with ~0ms added latency.'}
                  </motion.p>
                )}
              </motion.button>
            ))}

            {/* Stat pills */}
            <div className="flex gap-3 mt-4 flex-wrap">
              {[
                { val: '< 3 KB', label: 'Browser SDK size' },
                { val: '1 call', label: 'To start tracking' },
                { val: '~0 ms', label: 'Added latency' },
              ].map((s) => (
                <div key={s.val} className="flex-1 min-w-[120px] text-center p-4 rounded-xl border border-border-light bg-surface-white">
                  <div className="font-bold text-lg text-primary font-mono">{s.val}</div>
                  <div className="text-xs text-text-secondary">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Code window - Aceternity glow style */}
          <motion.div
            key={animKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-xl border border-border-light bg-surface-white overflow-hidden shadow-xl"
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-secondary-container/20 opacity-60 pointer-events-none" />

            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border-light bg-surface-bright relative">
              <div className="w-3 h-3 rounded-full bg-error/60" />
              <div className="w-3 h-3 rounded-full bg-tertiary/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <div className="ml-4 flex items-center gap-2 bg-surface-subtle border border-border-light rounded-md px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-mono text-xs text-text-secondary">{CODE_STEPS[activeStep].lang}</span>
              </div>
            </div>

            {/* Line numbers + code */}
            <div className="flex p-6 gap-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {/* Line numbers */}
              <div className="flex flex-col text-right select-none" aria-hidden>
                {CODE_STEPS[activeStep].code.split('\n').map((_, i) => (
                  <span key={i} className="font-mono text-[13px] leading-6 text-text-secondary/30">{i + 1}</span>
                ))}
              </div>
              {/* Code */}
              <div className="flex-1">
                {CODE_STEPS[activeStep].code.split('\n').map((line, i) => (
                  <CodeLine key={`${animKey}-${i}`} line={line} index={i} animate={true} />
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border-light bg-surface-bright text-xs text-text-secondary font-mono">
              <span>vision-analytics / sdk</span>
              <span className="text-primary font-semibold">✓ TypeScript ready</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
