import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Bot, User, Sparkles } from 'lucide-react';

const categories = [
  {
    title: 'Visitor Tracking',
    color: 'bg-green-500',
    items: ['Visitor traffic', 'Live user journeys', 'Session replays', 'Cohort retention']
  },
  {
    title: 'AI Cost Tracking',
    color: 'bg-blue-500',
    items: ['Prompt & trace trees', 'Streaming TTFT latency', 'Model benchmarks', 'Token volume']
  },
  {
    title: 'Unit Economics',
    color: 'bg-orange-500',
    items: ['Gross margin per user', 'Cost-to-serve (CTS)', 'Inference payback', 'AI ROI ratio']
  },
  {
    title: 'Revenue Analytics',
    color: 'bg-purple-500',
    items: ['Conversion funnels', 'Upgrade attribution', 'MRR analytics', 'Payment connections']
  }
];

const providers = ['Gemini', 'OpenAI', 'Anthropic', 'OpenRouter'];

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  provider?: string;
};

const chatScript: Message[] = [
  { id: 1, role: 'user', text: 'Which pages have the highest drop-off rate this week?' },
  {
    id: 2,
    role: 'assistant',
    text: 'Your /pricing page has a 72% drop-off rate — the highest this week. Users typically leave within 8 seconds. The /signup page is second at 61%.',
    provider: 'Gemini'
  },
  { id: 3, role: 'user', text: 'Any patterns in the sessions that convert?' },
  {
    id: 4,
    role: 'assistant',
    text: 'Yes — converting sessions average 3.4 page views and spend at least 45s on /features. Sessions from blog referrals convert 2.1× better than paid traffic.',
    provider: 'Gemini'
  },
];

const ProviderBadge = ({ name }: { name: string }) => {
  const colors: Record<string, string> = {
    Gemini: 'text-blue-400',
    OpenAI: 'text-green-400',
    Anthropic: 'text-orange-400',
    OpenRouter: 'text-purple-400',
  };
  return (
    <span className={`text-xs font-semibold ${colors[name] ?? 'text-white/40'} flex items-center gap-1`}>
      <Sparkles className="w-3 h-3" />
      {name}
    </span>
  );
};

const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-text-secondary/40"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const ChatBubble = ({ msg, visible }: { msg: Message; visible: boolean }) => {
  const isUser = msg.role === 'user';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          {!isUser && (
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mb-0.5">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
            {!isUser && msg.provider && <ProviderBadge name={msg.provider} />}
            <div
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-surface-container text-text-primary rounded-bl-sm border border-border-light'
                }`}
            >
              {msg.text}
            </div>
          </div>
          {isUser && (
            <div className="w-7 h-7 rounded-full bg-surface-container border border-border-light flex items-center justify-center shrink-0 mb-0.5">
              <User className="w-4 h-4 text-text-secondary" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AnimatedChat = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Start animation when section scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const delays = [600, 1800, 3000, 4400]; // When each message appears

    const timers: ReturnType<typeof setTimeout>[] = [];

    chatScript.forEach((msg, idx) => {
      if (msg.role === 'assistant') {
        // Show typing dots 800ms before assistant message
        timers.push(
          setTimeout(() => setShowTyping(true), delays[idx] - 800)
        );
      }
      timers.push(
        setTimeout(() => {
          setShowTyping(false);
          setVisibleCount(idx + 1);
        }, delays[idx])
      );
    });

    // Loop: restart after all messages shown
    const loopTimer = setTimeout(() => {
      setVisibleCount(0);
      setShowTyping(false);
      setTimeout(() => setStarted(false), 300);
      setTimeout(() => setStarted(true), 900);
    }, delays[chatScript.length - 1] + 3200);

    timers.push(loopTimer);
    return () => timers.forEach(clearTimeout);
  }, [started]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount, showTyping]);

  return (
    <div ref={sectionRef} className="rounded-2xl overflow-hidden bg-surface-container-lowest border border-border-light shadow-xl shadow-black/10 flex flex-col h-[420px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-surface-bright shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-text-primary text-sm font-semibold leading-none mb-0.5">Vision AI</p>
            <p className="text-text-secondary text-xs">Powered by your API key</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-text-secondary">Active</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-bright"
        style={{ scrollbarWidth: 'none' }}
      >
        {chatScript.map((msg, idx) => (
          <ChatBubble key={`${msg.id}-${started}`} msg={msg} visible={idx < visibleCount} />
        ))}

        <AnimatePresence>
          {showTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-surface-container border border-border-light rounded-2xl rounded-bl-sm">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar (decorative) */}
      <div className="px-5 py-4 border-t border-border-light bg-surface-bright shrink-0">
        <div className="flex items-center gap-3 bg-surface-container-lowest border border-border-light rounded-xl px-4 py-3">
          <span className="text-text-secondary/50 text-sm flex-1 select-none">Ask anything about your analytics…</span>
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const AiOperations = () => {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-surface-variant" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute -top-2 -left-2 w-4 h-4 text-surface-variant pointer-events-none">+</div>
        <div className="absolute -top-2 -right-2 w-4 h-4 text-surface-variant pointer-events-none">+</div>

        {/* Top Section: Features Grid */}
        <div className="mb-32 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <h2 className="text-display-lg text-text-primary max-w-2xl tracking-tight">
              From first prompt to profitable customer.
            </h2>
            <p className="text-body-lg text-text-secondary max-w-md">
              Connect user navigation, prompt executions, model spend, and financial margins in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-surface-variant relative">
            <div className="absolute -bottom-2 -left-2 w-4 h-4 text-surface-variant pointer-events-none">+</div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 text-surface-variant pointer-events-none">+</div>
            {categories.map((category, idx) => (
              <div key={idx} className="border-r border-b border-surface-variant p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-2 ${category.color}`} />
                  <h3 className="font-semibold text-text-primary">{category.title}</h3>
                </div>
                <ul className="space-y-4">
                  {category.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="group flex items-center justify-between text-text-secondary hover:text-primary transition-colors cursor-pointer text-body-md"
                    >
                      <span>{item}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: AI Chat */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-display-lg text-text-primary mb-6 tracking-tight leading-tight">
              Analytics your<br />AI can operate.
            </h2>
            <p className="text-body-lg text-text-secondary mb-10 leading-relaxed">
              Chat with your analytics using your own API key — no middleman, no markup. Connect Gemini, OpenAI, Anthropic or OpenRouter and ask plain-English questions. Vision gives your model direct access to live traffic, funnel data, and user sessions so you get answers, not just dashboards.
            </p>

            <div>
              <p className="text-label-md text-text-secondary mb-4">Works with</p>
              <div className="flex flex-wrap gap-3">
                {providers.map((provider) => (
                  <span
                    key={provider}
                    className="px-5 py-2 rounded-full border border-surface-variant text-text-primary text-sm font-medium hover:border-primary transition-colors cursor-default"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AnimatedChat />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AiOperations;
