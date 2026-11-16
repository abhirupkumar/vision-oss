import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WorldMapCard from './WorldMapCard';
import JourneySankeyCard from './JourneySankeyCard';

export default function FeatureBento() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // --- Live Data Simulation Hooks ---

  // AI Chat Simulation
  const aiConversations = [
    { q: "Why the sudden traffic spike?", a: "A post on Hacker News is driving 1.2k concurrent visitors right now." },
    { q: "Any checkout anomalies?", a: "Drop-offs in Germany increased by 14% due to API latency." },
    { q: "Best performing channel?", a: "Organic search conversion is up 4.2% week-over-week." },
    { q: "Who is upgrading?", a: "Enterprise users from the UK are upgrading 3x faster today." }
  ];
  const [chatIdx, setChatIdx] = useState(0);
  const [chatStep, setChatStep] = useState<'q' | 'a'>('q');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (chatStep === 'q') {
      timeout = setTimeout(() => setChatStep('a'), 2000); // 2s thinking time
    } else {
      timeout = setTimeout(() => {
        setChatStep('q');
        setChatIdx(prev => (prev + 1) % aiConversations.length);
      }, 5000); // 5s reading time
    }
    return () => clearTimeout(timeout);
  }, [chatStep, aiConversations.length]);

  // Revenue Simulation
  const [revenue, setRevenue] = useState(24532);
  const [revChart, setRevChart] = useState([30, 40, 25, 50, 45, 60, 55, 70, 65, 80]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const added = Math.floor(Math.random() * 150) + 50;
        setRevenue(prev => prev + added);
        setRevChart(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] += (added / 100);
          return newArr;
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Visitors Simulation (Area Chart) - Smoothed
  const [visitors, setVisitors] = useState(128402);
  const [visChart, setVisChart] = useState(Array.from({ length: 40 }, () => 40));
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors(prev => prev + Math.floor(Math.random() * 5) + 1);
      setVisChart(prev => {
        const last = prev[prev.length - 1];
        // Move slightly from the last point (max +/- 4) to keep graph smooth
        const next = Math.max(10, Math.min(90, last + (Math.random() * 8 - 4)));
        return [...prev.slice(1), next];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Events Table Simulation
  const [events, setEvents] = useState([
    { label: 'page_view', count: 45201, max: 50000 },
    { label: 'button_click', count: 12403, max: 50000 },
    { label: 'form_submit', count: 3201, max: 50000 },
    { label: 'checkout', count: 852, max: 50000 },
  ]);
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => prev.map((e, i) => {
        if (Math.random() > (0.2 + (i * 0.2))) {
          return { ...e, count: e.count + Math.floor(Math.random() * 5) + 1 };
        }
        return e;
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Funnel Simulation
  const [funnel, setFunnel] = useState([
    { step: 'Page View', val: 100 },
    { step: 'Sign Up', val: 42 },
    { step: 'Onboarding', val: 28 },
    { step: 'Paid', val: 12 },
  ]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setFunnel(prev => {
          const arr = [...prev];
          arr[0].val = 100;
          arr[1].val = Math.min(100, Math.max(38, arr[1].val + (Math.random() * 2 - 1)));
          arr[2].val = Math.min(arr[1].val, Math.max(20, arr[2].val + (Math.random() * 1.5 - 0.75)));
          arr[3].val = Math.min(arr[2].val, Math.max(8, arr[3].val + (Math.random() * 0.8 - 0.4)));
          return arr;
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Map Dots Simulation
  const [activeDots, setActiveDots] = useState<number[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 2-4 random dots to be active
      const dotsCount = Math.floor(Math.random() * 3) + 2;
      const newDots = [];
      for (let i = 0; i < dotsCount; i++) {
        newDots.push(Math.floor(Math.random() * 15));
      }
      setActiveDots(newDots);
    }, 1500);
    return () => clearInterval(interval);
  }, []);


  return (
    <section id="features" className="py-24 px-margin-desktop mx-auto border-t border-border-light">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px] max-w-container-max mx-auto"
      >

        {/* === ROW 1 === */}

        {/* AI Insights (1 col) */}
        <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col h-full relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 relative z-20">
            <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
            <span className="text-sm font-medium text-text-secondary">AI Insights</span>
          </div>

          <div className="flex-1 w-full flex flex-col justify-end gap-3 relative z-10 pb-2">
            {/* User Bubble */}
            <motion.div
              key={`q-${chatIdx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="self-end bg-surface-subtle border border-border-light text-text-primary text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%]"
            >
              {aiConversations[chatIdx].q}
            </motion.div>

            {/* AI Bubble */}
            <AnimatePresence mode="wait">
              {chatStep === 'a' ? (
                <motion.div
                  key={`a-${chatIdx}`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', bounce: 0.3 }}
                  className="self-start bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-2 rounded-2xl rounded-tl-sm max-w-[95%] leading-relaxed font-medium"
                >
                  {aiConversations[chatIdx].a}
                </motion.div>
              ) : (
                <motion.div
                  key={`typing-${chatIdx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="self-start bg-surface-bright border border-border-light text-text-secondary px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center h-[34px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* LLM Observability (1 col) */}
        {(() => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [llmCost, setLlmCost] = useState(0.2471);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [llmBars, setLlmBars] = useState([40, 55, 45, 70, 60, 80, 72, 90, 85, 95]);
          const models = ['gpt-4o', 'claude-3-5', 'gemini-2.0'];
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [modelIdx, setModelIdx] = useState(0);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            const cost = setInterval(() => {
              if (Math.random() > 0.5) {
                const added = Math.random() * 0.0012 + 0.0002;
                setLlmCost(prev => prev + added);
                setLlmBars(prev => {
                  const next = [...prev];
                  next[next.length - 1] += added * 40;
                  return next;
                });
              }
            }, 2500);
            const model = setInterval(() => {
              setModelIdx(i => (i + 1) % models.length);
            }, 3000);
            return () => { clearInterval(cost); clearInterval(model); };
          }, []);
          return (
            <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col justify-between h-full overflow-hidden">
              <div className="flex items-start justify-between w-full mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                  <span className="text-sm font-medium text-text-secondary">LLM Observability</span>
                </div>
                <motion.div
                  key={modelIdx}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-mono font-semibold border border-primary/20"
                >
                  {models[modelIdx]}
                </motion.div>
              </div>
              <div className="flex flex-col gap-2">
                <motion.span
                  key={llmCost.toFixed(4)}
                  initial={{ color: '#F1592A' }}
                  animate={{ color: '#1A1C1E' }}
                  transition={{ duration: 0.8 }}
                  className="text-2xl font-bold tabular-nums text-text-primary"
                >
                  ${llmCost.toFixed(4)}
                </motion.span>
                <p className="text-[11px] text-text-secondary -mt-1">API cost today</p>
                <div className="flex items-end gap-0.5 h-10 w-full mt-1">
                  {llmBars.map((val, i) => (
                    <motion.div
                      key={i}
                      layout
                      className="flex-1 bg-primary/50 rounded-t-sm"
                      style={{ height: `${Math.max((val / 100) * 100, 8)}%` }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Model Comparison (1 col) */}
        {(() => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [modelCompareIdx, setModelCompareIdx] = useState(0);
          const modelsList = [
            { name: 'GPT-4o', latency: '420ms', cost: '$0.005', score: '94%', badge: 'Best Reason' },
            { name: 'Claude 3.5', latency: '310ms', cost: '$0.003', score: '96%', badge: 'Top Quality' },
            { name: 'Gemini 2.0', latency: '180ms', cost: '$0.001', score: '92%', badge: 'Ultra Fast' },
          ];
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            const timer = setInterval(() => {
              setModelCompareIdx(prev => (prev + 1) % modelsList.length);
            }, 3000);
            return () => clearInterval(timer);
          }, []);
          const cur = modelsList[modelCompareIdx];

          return (
            <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col justify-between h-full overflow-hidden">
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">balance</span>
                  <span className="text-sm font-medium text-text-secondary">Model Comparison</span>
                </div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold border border-primary/20">Benchmark</span>
              </div>

              <div className="flex flex-col gap-2 my-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cur.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-between bg-surface-bright p-2 rounded border border-border-light"
                  >
                    <span className="text-xs font-bold text-text-primary font-mono">{cur.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium border border-emerald-500/20">{cur.badge}</span>
                  </motion.div>
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-surface-subtle p-1.5 rounded">
                    <span className="text-[9px] text-text-secondary block uppercase">Latency</span>
                    <span className="text-xs font-bold font-mono text-text-primary">{cur.latency}</span>
                  </div>
                  <div className="bg-surface-subtle p-1.5 rounded">
                    <span className="text-[9px] text-text-secondary block uppercase">Cost/1k</span>
                    <span className="text-xs font-bold font-mono text-text-primary">{cur.cost}</span>
                  </div>
                  <div className="bg-surface-subtle p-1.5 rounded">
                    <span className="text-[9px] text-text-secondary block uppercase">Eval Score</span>
                    <span className="text-xs font-bold font-mono text-text-primary">{cur.score}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Revenue Tracking (1 col) */}
        <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between w-full mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-text-secondary">payments</span>
              <span className="text-sm font-medium text-text-secondary">Revenue</span>
            </div>
            <div className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              12.4%
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <motion.span
              key={revenue}
              initial={{ color: '#10B981' }}
              animate={{ color: '#1A1C1E' }}
              transition={{ duration: 1 }}
              className="text-3xl font-bold tabular-nums text-text-primary"
            >
              ${revenue.toLocaleString()}
            </motion.span>

            <div className="flex items-end gap-1 h-12 w-full mt-2">
              {revChart.map((val, i) => (
                <motion.div
                  key={i}
                  layout
                  className="flex-1 bg-green-500/60 rounded-t-sm"
                  style={{ height: `${Math.max((val / 100) * 100, 10)}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* === ROW 2 === */}

        {/* Visitors (2 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 bg-surface-white border border-border-light rounded-lg shadow-sm overflow-hidden flex flex-col h-full relative">
          <div className="p-5 relative z-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-text-secondary">group</span>
              <span className="text-sm font-medium text-text-secondary">Total Visitors</span>
            </div>
            <motion.div
              key={visitors}
              initial={{ color: '#2680eb' }}
              animate={{ color: '#1A1C1E' }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold tabular-nums text-text-primary"
            >
              {visitors.toLocaleString()}
            </motion.div>
          </div>
          {/* Smooth SVG Area Chart Simulation */}
          <div className="absolute inset-x-0 bottom-0 h-32 z-10 flex items-end">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 100" className="opacity-60 text-[#2680eb]">
              <defs>
                <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                fill="url(#visGradient)"
                stroke="currentColor"
                strokeWidth="2"
                initial={false}
                animate={{
                  d: `M0,100 L0,${100 - visChart[0]} ` + visChart.map((v, i) => `L${i * 10.2},${100 - v}`).join(' ') + ` L400,100 Z`
                }}
                transition={{ type: 'tween', duration: 1.2, ease: "linear" }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Session Replays (2 cols) */}
        {(() => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [replaySec, setReplaySec] = useState(83); // Starts at 1:23
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [isPlaying, setIsPlaying] = useState(true);

          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (!isPlaying) return;
            const timer = setInterval(() => {
              setReplaySec(prev => (prev >= 138 ? 0 : prev + 1));
            }, 600);
            return () => clearInterval(timer);
          }, [isPlaying]);

          const formatTime = (s: number) => {
            const mins = Math.floor(s / 60);
            const secs = s % 60;
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          };

          return (
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 bg-surface-white border border-border-light rounded-lg shadow-sm p-4 flex flex-col justify-between h-full relative overflow-hidden">
              {/* Top Header Bar */}
              <div className="flex items-center justify-between w-full mb-1.5 font-mono text-xs text-text-secondary border-b border-border-light/60 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-primary font-medium">replay</span>
                  <span>·</span>
                  <span>visitor 4f2a91</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>🇺🇸</span>
                  <span className="material-symbols-outlined text-[15px] text-emerald-600" style={{ fontVariationSettings: '"FILL" 1' }}>public</span>
                  <span className="material-symbols-outlined text-[15px] text-text-secondary">desktop_mac</span>
                </div>
              </div>

              {/* Browser Wireframe Frame */}
              <div className="bg-surface-subtle border border-border-light rounded-md overflow-hidden flex flex-col flex-1 relative my-1">
                {/* Browser Top Bar */}
                <div className="bg-surface-bright border-b border-border-light/60 px-3 py-1.5 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="bg-surface-white border border-border-light/80 rounded px-2 py-0.5 text-[10px] font-mono text-text-secondary">
                    acme.com/products
                  </div>
                </div>

                {/* Browser Content Area with moving cursor */}
                <div className="p-3 flex flex-col gap-2.5 relative flex-1 justify-between overflow-hidden">
                  {/* Top nav/headline wireframe */}
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-3.5 bg-text-primary/90 rounded-full" />
                    <div className="flex gap-1.5">
                      <div className="w-7 h-2 bg-text-secondary/20 rounded-full" />
                      <div className="w-7 h-2 bg-text-secondary/20 rounded-full" />
                      <div className="w-7 h-2 bg-text-secondary/20 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-40 h-4 bg-text-primary/90 rounded-md" />
                    <div className="w-56 h-2 bg-text-secondary/20 rounded-full" />
                    <div className="w-24 h-3.5 bg-text-primary/90 rounded-md" />
                  </div>

                  {/* 3 Product Cards Wireframe */}
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="bg-surface-white border border-border-light/80 rounded p-1.5 flex flex-col justify-between h-14">
                        <div className="w-full h-6 bg-text-secondary/15 rounded" />
                        <div className="flex justify-between items-center pt-1">
                          <div className="w-1/2 h-1.5 bg-text-secondary/20 rounded-full" />
                          <div className="w-2.5 h-2.5 bg-text-primary rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Animated Pointer / Cursor Moving Across UI */}
                  <motion.div
                    className="absolute z-30 pointer-events-none"
                    animate={{
                      x: [20, 120, 160, 240, 20],
                      y: [15, 25, 75, 70, 15],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {/* SVG Pointer Arrow matching standard mouse cursor */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                      <path
                        d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                        fill="#374151"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {/* Click Ripple Indicator */}
                    <motion.span
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-500/40 border border-emerald-500"
                      animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.9, 0, 0.9] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Bottom Playback Control Bar */}
              <div className="flex items-center gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
                </button>

                {/* Scrub Bar */}
                <div className="flex-1 bg-surface-bright h-1.5 rounded-full overflow-hidden relative border border-border-light flex items-center">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(replaySec / 138) * 100}%` }}
                    transition={{ ease: "linear" }}
                  />
                  {/* Event markers (amber dots) */}
                  <div className="absolute left-[42%] w-2 h-2 bg-amber-400 rounded-full border border-white" />
                  <div className="absolute left-[72%] w-2 h-2 bg-amber-400 rounded-full border border-white" />
                </div>

                {/* Timer */}
                <span className="text-[11px] font-mono text-text-secondary tabular-nums flex-shrink-0">
                  {formatTime(replaySec)} / 2:18
                </span>
              </div>
            </motion.div>
          );
        })()}

        {/* === ROW 3 === */}

        {/* Conversion Funnels (1 col) */}
        <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">filter_alt</span>
            <span className="text-sm font-medium text-text-secondary">Funnels</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-2">
            {funnel.map((f, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-xs text-text-secondary px-1">
                  <span>{f.step}</span>
                  <span className="font-semibold tabular-nums">{f.val.toFixed(1)}%</span>
                </div>
                <div className="w-full h-5 bg-surface-bright border border-border-light rounded overflow-hidden relative flex items-center">
                  <motion.div
                    layout
                    className="absolute left-0 top-0 bottom-0 bg-primary/20 border-r border-primary/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${f.val}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Journeys (3 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-3 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col h-full relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 relative z-20">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">account_tree</span>
            <span className="text-sm font-medium text-text-secondary">User Journeys</span>
          </div>
          <div className="flex-1 w-full h-full relative z-10">
            <JourneySankeyCard />
          </div>
        </motion.div>


        {/* === ROW 4 === */}

        {/* Events Table (1 col) */}
        <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">mouse</span>
            <span className="text-sm font-medium text-text-secondary">Top Events</span>
          </div>

          <div className="grid grid-cols-[1fr_80px] px-2 py-1 border-b border-border-light mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary/80">Event</span>
            <span className="text-right text-xs font-bold uppercase tracking-wider text-text-secondary/80">Count</span>
          </div>

          <div className="flex flex-col gap-1 flex-1 justify-center">
            {events.map((event, i) => (
              <div key={i} className="relative group overflow-hidden rounded transition-all hover:bg-surface-subtle">
                <motion.div
                  layout
                  className="absolute inset-y-0 left-0 bg-black/[0.04] pointer-events-none"
                  initial={{ width: 0 }}
                  animate={{ width: `${(event.count / event.max) * 100}%` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                />
                <div className="grid grid-cols-[1fr_80px] items-center px-2 py-1.5 relative z-10">
                  <span className="text-xs font-code-md text-text-primary truncate">{event.label}</span>
                  <motion.span
                    key={event.count}
                    initial={{ color: '#F1592A' }}
                    animate={{ color: '#1A1C1E' }}
                    className="text-xs font-bold tabular-nums text-text-primary text-right"
                  >
                    {event.count.toLocaleString()}
                  </motion.span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* World Map (2 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col h-full relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 relative z-20">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">public</span>
            <span className="text-sm font-medium text-text-secondary">Global Traffic</span>
          </div>

          <div className="flex-1 w-full h-full relative z-10">
            <WorldMapCard />
          </div>
        </motion.div>

        {/* Retention Cohorts (1 col) */}
        <motion.div variants={itemVariants} className="col-span-1 bg-surface-white border border-border-light rounded-lg shadow-sm p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">calendar_month</span>
            <span className="text-sm font-medium text-text-secondary">Cohorts & Retention</span>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center">
            <div className="grid grid-cols-5 gap-1 mb-1">
              <div className="text-[9px] text-text-secondary/60 uppercase font-bold text-center">Cohort</div>
              <div className="text-[9px] text-text-secondary/60 uppercase font-bold text-center">W1</div>
              <div className="text-[9px] text-text-secondary/60 uppercase font-bold text-center">W2</div>
              <div className="text-[9px] text-text-secondary/60 uppercase font-bold text-center">W3</div>
              <div className="text-[9px] text-text-secondary/60 uppercase font-bold text-center">W4</div>
            </div>

            {[
              { cohort: 'Jun 01', data: [100, 45, 32, 28] },
              { cohort: 'Jun 08', data: [100, 52, 38, null] },
              { cohort: 'Jun 15', data: [100, 48, null, null] },
              { cohort: 'Jun 22', data: [100, null, null, null] },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-5 gap-1 mb-1 flex-1 max-h-8">
                <div className="flex items-center justify-center text-[10px] font-medium text-text-secondary bg-surface-bright rounded h-full">
                  {row.cohort}
                </div>
                {row.data.map((val, j) => (
                  <div
                    key={j}
                    className={`flex items-center justify-center text-[10px] font-bold tabular-nums rounded transition-colors h-full`}
                    style={{
                      backgroundColor: val !== null ? `hsla(143, 71%, 42%, ${(0.08 + (val / 100) * 0.82).toFixed(3)})` : 'transparent',
                      color: val !== null ? (val >= 50 ? '#064e3b' : '#1A1C1E') : 'transparent'
                    }}
                  >
                    {val !== null ? `${val}%` : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
