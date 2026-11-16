import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { DASHBOARD_URL } from '../lib/config';

const testimonials = [
  {
    quote: "We replaced PostHog AND Langfuse with Vision. One dashboard, one bill. The LLM cost tracking alone saved us from a $4,000 surprise at the end of the month.",
    author: "Arjun M.",
    role: "Co-founder & CTO",
    company: "Draftr AI",
    avatar: "AM",
    color: "bg-primary/10 text-primary",
    metric: "$4K saved",
    metricLabel: "first month",
  },
  {
    quote: "I set up Vision in 10 minutes. Session replays, token traces, web vitals — everything just worked. My team now ships with way more confidence.",
    author: "Sophie L.",
    role: "Head of Engineering",
    company: "Pathfinder",
    avatar: "SL",
    color: "bg-secondary/10 text-secondary",
    metric: "10 min",
    metricLabel: "to full setup",
  },
  {
    quote: "The @observe() decorator is genuinely magic. I wrapped our entire RAG pipeline and now I can see exactly which retrieval step is killing our latency.",
    author: "Kevin T.",
    role: "AI Engineer",
    company: "Loom",
    avatar: "KT",
    color: "bg-tertiary/10 text-tertiary",
    metric: "3× faster",
    metricLabel: "debug cycles",
  },
  {
    quote: "The geographic breakdown combined with LLM usage per region is something I've never seen in any other tool. Absolute game changer for our pricing model.",
    author: "Priya R.",
    role: "Product Manager",
    company: "Petal",
    avatar: "PR",
    color: "bg-primary/10 text-primary",
    metric: "1 dashboard",
    metricLabel: "for everything",
  },
  {
    quote: "Vision's session replay caught a bug where our AI chatbot was looping on certain users. We would never have found that in logs alone.",
    author: "Marcus D.",
    role: "Founder",
    company: "Quill",
    avatar: "MD",
    color: "bg-secondary/10 text-secondary",
    metric: "Bug caught",
    metricLabel: "in 5 minutes",
  },
  {
    quote: "The streaming proxy works seamlessly with OpenAI and Anthropic. Zero performance overhead and ~0 ms added latency to our client streams.",
    author: "Yuki S.",
    role: "Backend Engineer",
    company: "Resonance",
    avatar: "YS",
    color: "bg-tertiary/10 text-tertiary",
    metric: "~0 ms",
    metricLabel: "added latency",
  },
];

// 3D tilt card - Aceternity style
function TiltCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-8deg', '8deg']);
  const glowX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="relative h-full"
    >
      <div className="h-full rounded-2xl border border-border-light bg-surface-white p-7 flex flex-col gap-5 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-300 overflow-hidden">
        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(172,46,0,0.06) 0%, transparent 60%)`,
          }}
        />

        {/* Metric pill */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${testimonial.color} border border-current/20`}>
            <span>{testimonial.metric}</span>
            <span className="font-normal opacity-70">{testimonial.metricLabel}</span>
          </div>
          {/* Stars */}
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        {/* Quote */}
        <blockquote className="text-text-primary text-body-sm leading-relaxed flex-1 relative">
          <span className="absolute -top-1 -left-1 text-4xl text-primary/10 font-serif leading-none select-none">"</span>
          <span className="relative z-10">{testimonial.quote}</span>
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-border-light">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${testimonial.color}`}>
            {testimonial.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary leading-none mb-0.5">{testimonial.author}</div>
            <div className="text-xs text-text-secondary">{testimonial.role} · <span className="text-primary">{testimonial.company}</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-24 bg-surface border-t border-border-light overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <p className="text-label-xs uppercase tracking-widest text-primary mb-3 font-semibold">Social proof</p>
            <h2 className="font-headline-lg text-headline-lg text-text-primary max-w-xl">
              AI teams ship faster<br />with Vision.
            </h2>
          </div>
          <div className="flex items-center gap-8">
            {[
              { val: '500+', label: 'AI startups' },
              { val: '2B+', label: 'Events tracked' },
              { val: '4.9/5', label: 'Avg rating' },
            ].map((s) => (
              <div key={s.val} className="text-center">
                <div className="text-headline-md text-text-primary font-bold">{s.val}</div>
                <div className="text-xs text-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6" style={{ perspective: '1000px' }}>
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="break-inside-avoid group"
            >
              <TiltCard testimonial={t} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-text-secondary text-body-md mb-6">Join hundreds of AI-native startups already on Vision.</p>
          <motion.a
            href={DASHBOARD_URL}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
          >
            Start free — no credit card required
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
