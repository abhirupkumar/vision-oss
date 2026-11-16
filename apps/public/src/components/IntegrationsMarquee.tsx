import React, { useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';

// Infinite marquee - Aceternity style
function InfiniteMarquee({ items, speed = 40, reverse = false }: { items: { name: string; icon: string }[], speed?: number, reverse?: boolean }) {
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    const dir = reverse ? 1 : -1;
    baseX.set(baseX.get() + dir * (delta / 1000) * speed);
  });

  const x = useTransform(baseX, (v) => `${v % (items.length * 220)}px`);

  const doubled = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden w-full" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
      <motion.div className="flex gap-4 w-max" style={{ x }}>
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-3 rounded-full border border-border-light bg-surface-white text-text-secondary font-medium text-sm whitespace-nowrap hover:border-primary/40 hover:text-text-primary transition-colors cursor-default select-none"
          >
            <span className="text-base">{item.icon}</span>
            {item.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const row1 = [
  { name: 'OpenAI', icon: '◆' },
  { name: 'Anthropic', icon: '◎' },
  { name: 'Gemini', icon: '✦' },
  { name: 'Next.js', icon: '△' },
  { name: 'Vercel', icon: '▲' },
  { name: 'OpenRouter', icon: '⬡' },
];

const row2 = [
  { name: 'Django', icon: '🐍' },
  { name: 'FastAPI', icon: '⚡' },
  { name: 'Moonshot', icon: '🌙' },
  { name: 'LangChain', icon: '🔗' },
  { name: 'React', icon: '⚛' },
  { name: 'Supabase', icon: '⚡' },
];

export default function IntegrationsMarquee() {
  return (
    <section className="py-20 bg-surface border-t border-border-light overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-desktop mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-label-xs uppercase tracking-widest text-primary mb-3 font-semibold">Ecosystem</p>
            <h2 className="font-headline-lg text-headline-lg text-text-primary">Works with your entire stack.</h2>
          </div>
          <p className="text-text-secondary max-w-sm text-body-md">
            One SDK. Every provider, framework, and runtime you already use.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <InfiniteMarquee items={row1} speed={35} />
        <InfiniteMarquee items={row2} speed={28} reverse />
      </div>
    </section>
  );
}
