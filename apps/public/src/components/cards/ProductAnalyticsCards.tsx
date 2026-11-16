import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { ResponsiveSankey } from '@nivo/sankey';
import { Play, Pause, Activity, Globe, Eye, Filter } from 'lucide-react';

// ─── 1. EVENT TRACKING CARD ──────────────────────────────────────────────────
export function EventTrackingCard() {
  const [events, setEvents] = useState([
    { id: 1, name: 'checkout_completed', path: '/checkout/success', count: 852, time: 'Just now', tagColor: 'text-emerald-700 dark:text-[#00E599] bg-emerald-500/10' },
    { id: 2, name: 'button_click_cta', path: '/pricing', count: 12403, time: '2s ago', tagColor: 'text-purple-700 dark:text-[#A78BFA] bg-purple-500/10' },
    { id: 3, name: 'page_view', path: '/docs/quickstart', count: 45201, time: '4s ago', tagColor: 'text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-white/[0.06]' },
    { id: 4, name: 'form_submit_signup', path: '/register', count: 3201, time: '7s ago', tagColor: 'text-emerald-700 dark:text-[#00E599] bg-emerald-500/10' },
  ]);

  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const updated = [...prev];
        updated[randomIndex] = {
          ...updated[randomIndex],
          count: updated[randomIndex].count + 1,
          time: 'Just now',
        };
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <FeatureCard
      title="Event Tracking"
      description="Capture custom clicks, pageviews, and transactions in real-time with zero latency and full attribute filtering."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono text-xs">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E599] animate-pulse" />
            <span className="font-semibold text-t-primary font-sans text-sm">Live Event Stream</span>
          </div>
          <div className="flex gap-1.5 text-[11px]">
            {['All', 'Clicks', 'Pages'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeFilter === f
                    ? 'bg-emerald-600 dark:bg-[#00E599] text-white dark:text-[#090D14] font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-t-secondary hover:text-t-primary border border-slate-200/60 dark:border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Event List (Clean, adaptive containers) */}
        <div className="space-y-2 my-auto">
          {events.map((e) => (
            <motion.div
              key={e.id}
              layout
              className="flex items-center justify-between bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-3 rounded-xl shadow-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${e.tagColor}`}>
                  {e.name}
                </span>
                <span className="text-t-muted truncate text-[11px]">{e.path}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-t-primary font-bold">{e.count.toLocaleString()}</span>
                <span className="text-t-muted text-[10px] hidden sm:inline">{e.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer stat */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-t-secondary font-sans">
          <span>Throughput: <strong className="text-t-primary font-mono">1,420 events/sec</strong></span>
          <span className="text-emerald-700 dark:text-[#00E599] font-semibold font-mono">99.99% ingested</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. REALTIME USER TRACKING CARD ──────────────────────────────────────────
export function RealtimeTrackingCard() {
  const [activeUsers, setActiveUsers] = useState(1284);
  const visitors = [
    { ip: 'usr_8f21', loc: '🇺🇸 SF', page: '/pricing', time: '1m 24s', device: 'Desktop' },
    { ip: 'usr_3a09', loc: '🇬🇧 London', page: '/docs/api', time: '3m 12s', device: 'Mobile' },
    { ip: 'usr_7b44', loc: '🇩🇪 Berlin', page: '/checkout', time: '45s', device: 'Desktop' },
    { ip: 'usr_1c99', loc: '🇯🇵 Tokyo', page: '/features', time: '2m 05s', device: 'Tablet' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveUsers((prev) => prev + (Math.random() > 0.4 ? 1 : -1));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <FeatureCard
      title="Realtime User Tracking"
      description="Monitor live active visitors across your site, their current URL path, device types, and concurrent traffic surges."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between">
        {/* Top Active Counter */}
        <div className="flex items-center justify-between bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-4 rounded-2xl shadow-xs">
          <div>
            <div className="text-[11px] text-t-secondary uppercase font-semibold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E599] animate-ping" />
              Online Right Now
            </div>
            <motion.div
              key={activeUsers}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold font-mono text-t-primary mt-1"
            >
              {activeUsers.toLocaleString()}
            </motion.div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-700 dark:text-[#00E599] bg-emerald-500/10 px-2.5 py-1 rounded-full">
              ▲ +14% concurrent
            </span>
            <div className="text-[10px] text-t-muted mt-1 font-mono">Peak: 1,840 today</div>
          </div>
        </div>

        {/* Live Visitor Feed (Adaptive colors & borders) */}
        <div className="space-y-1.5 my-2">
          {visitors.map((v, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-transparent font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{v.loc}</span>
                <span className="text-t-primary font-medium">{v.ip}</span>
              </div>
              <span className="text-purple-700 dark:text-[#A78BFA] text-[11px] truncate max-w-[140px] font-semibold">{v.page}</span>
              <span className="text-t-muted text-[10px]">{v.time}</span>
            </div>
          ))}
        </div>

        {/* Activity bar */}
        <div className="flex items-center justify-between text-[11px] text-t-secondary pt-1 font-sans">
          <span>Edge latency: <strong className="text-t-primary font-mono">24ms</strong></span>
          <span>48 countries active</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 3. USER JOURNEYS (SANKEY DIAGRAM) CARD ──────────────────────────────────
export function UserJourneysCard() {
  const sankeyData = {
    nodes: [
      { id: 'Home' },
      { id: 'Features' },
      { id: 'Pricing' },
      { id: 'Checkout' },
      { id: 'Success' },
    ],
    links: [
      { source: 'Home', target: 'Features', value: 450 },
      { source: 'Home', target: 'Pricing', value: 380 },
      { source: 'Features', target: 'Pricing', value: 310 },
      { source: 'Pricing', target: 'Checkout', value: 420 },
      { source: 'Checkout', target: 'Success', value: 360 },
    ],
  };

  return (
    <FeatureCard
      title="User Journeys"
      description="Visualize user drop-offs and navigation pathways with interactive multi-step Sankey flows."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between text-xs pb-1">
          <span className="font-semibold text-t-primary flex items-center gap-1.5 text-sm font-sans">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            Multi-step Navigation Flow
          </span>
          <span className="text-xs font-mono text-emerald-700 dark:text-[#00E599] font-bold">85.7% Conversion</span>
        </div>

        {/* Sankey Diagram (Generous proportions & rich modern palette) */}
        <div className="w-full h-[230px] relative">
          <ResponsiveSankey
            data={sankeyData}
            margin={{ top: 14, right: 65, bottom: 14, left: 60 }}
            align="justify"
            colors={['#00E599', '#8B5CF6', '#38BDF8', '#F59E0B', '#10B981']}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.3}
            nodeThickness={12}
            nodeSpacing={18}
            nodeBorderWidth={0}
            nodeBorderRadius={4}
            linkOpacity={0.4}
            linkHoverOthersOpacity={0.1}
            linkContract={1}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={8}
            labelTextColor={{ from: 'color' }}
            animate={true}
            theme={{
              labels: { text: { fontSize: 11, fontFamily: 'monospace', fontWeight: 600 } },
            }}
          />
        </div>

        {/* Step Breakdown summary footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-2 text-t-secondary bg-white dark:bg-[#111827] border border-slate-200/70 dark:border-white/[0.06] p-2 rounded-xl">
          <div>Home → Pricing: <strong className="text-t-primary">68%</strong></div>
          <div>Pricing → Cart: <strong className="text-t-primary">52%</strong></div>
          <div>Paid: <strong className="text-emerald-700 dark:text-[#00E599]">85%</strong></div>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 4. GEO MAPPINGS CARD ────────────────────────────────────────────────────
export function GeoMappingsCard() {
  const regions = [
    { country: 'United States', code: 'US', pct: 44, visitors: '56,490', flag: '🇺🇸', color: 'bg-emerald-500 dark:bg-[#00E599]' },
    { country: 'Germany', code: 'DE', pct: 22, visitors: '28,240', flag: '🇩🇪', color: 'bg-purple-600 dark:bg-[#8B5CF6]' },
    { country: 'United Kingdom', code: 'GB', pct: 16, visitors: '20,540', flag: '🇬🇧', color: 'bg-sky-500 dark:bg-[#38BDF8]' },
    { country: 'Japan', code: 'JP', pct: 12, visitors: '15,400', flag: '🇯🇵', color: 'bg-teal-500 dark:bg-[#2DD4BF]' },
  ];

  return (
    <FeatureCard
      title="GEO Mappings"
      description="Pinpoint global customer density and regional traffic volumes with pinpoint geographic latency and visitor counts."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between text-xs pb-1">
          <span className="font-semibold text-t-primary flex items-center gap-1.5 text-sm font-sans">
            <Globe className="w-4 h-4 text-purple-600 dark:text-[#A78BFA]" />
            Global Traffic Density
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#00E599] font-mono font-semibold">
            142 Countries
          </span>
        </div>

        {/* World Vector Graphic (Clean container) */}
        <div className="relative h-[150px] rounded-2xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-center overflow-hidden my-1 shadow-xs">
          <svg className="w-full h-full opacity-20 text-purple-600 dark:text-purple-400" viewBox="0 0 1000 500" fill="currentColor">
            <path d="M150,150 Q180,100 240,140 T320,180 T260,280 T150,220 Z M450,120 Q500,80 580,110 T650,180 T540,240 T440,160 Z M700,200 Q760,180 820,240 T780,320 T700,270 Z M200,320 Q240,300 280,360 T250,440 T190,380 Z" />
          </svg>

          {/* Pulsing Beacons on Key Capitals */}
          <div className="absolute top-[32%] left-[24%]">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 dark:bg-[#00E599] inline-block animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E599] inline-block absolute inset-0.5" />
          </div>
          <div className="absolute top-[28%] left-[48%]">
            <span className="w-3.5 h-3.5 rounded-full bg-purple-600 dark:bg-[#A78BFA] inline-block animate-ping" />
            <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-[#A78BFA] inline-block absolute inset-0.5" />
          </div>
          <div className="absolute top-[42%] left-[78%]">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 dark:bg-[#00E599] inline-block animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E599] inline-block absolute inset-0.5" />
          </div>

          <div className="absolute bottom-2 left-4 text-[10px] font-mono text-t-muted">
            Live edge servers routing 100% traffic
          </div>
        </div>

        {/* Country Breakdown bars */}
        <div className="space-y-1.5">
          {regions.map((r) => (
            <div key={r.code} className="text-xs">
              <div className="flex justify-between items-center text-[11px] mb-0.5">
                <span className="flex items-center gap-1.5 text-t-primary font-medium">
                  <span>{r.flag}</span>
                  {r.country}
                </span>
                <span className="font-mono text-t-secondary">{r.visitors} ({r.pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200/70 dark:bg-white/[0.05] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 5. SESSION REPLAYS CARD ─────────────────────────────────────────────────
export function SessionReplaysCard() {
  const [playing, setPlaying] = useState(true);
  const [sec, setSec] = useState(84); // 1m 24s

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setSec((s) => (s >= 138 ? 0 : s + 1));
    }, 600);
    return () => clearInterval(interval);
  }, [playing]);

  const format = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <FeatureCard
      title="Session Replays"
      description="Watch pixel-perfect user session playbacks to identify rage clicks, dead clicks, and onboarding friction."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between">
        {/* Replay metadata bar */}
        <div className="flex items-center justify-between font-mono text-xs pb-2">
          <div className="flex items-center gap-2 text-t-primary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E599]" />
            <span>visitor_4f2a91</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-t-muted">
            <span>🇺🇸 Chrome</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/[0.06] text-t-primary">1080p</span>
          </div>
        </div>

        {/* Video Frame Simulation with Animated Cursor */}
        <div className="relative flex-1 my-2 rounded-2xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-4 overflow-hidden flex flex-col justify-between shadow-xs">
          {/* Wireframe simulated web page */}
          <div className="flex justify-between items-center pb-2">
            <div className="w-20 h-3.5 bg-slate-200 dark:bg-white/[0.08] rounded-md" />
            <div className="flex gap-2">
              <div className="w-8 h-2.5 bg-slate-200/70 dark:bg-white/[0.05] rounded" />
              <div className="w-8 h-2.5 bg-slate-200/70 dark:bg-white/[0.05] rounded" />
              <div className="w-12 h-3.5 bg-emerald-500/20 dark:bg-[#00E599]/30 rounded" />
            </div>
          </div>

          <div className="space-y-2 py-2">
            <div className="w-3/5 h-4 bg-slate-200 dark:bg-white/[0.08] rounded" />
            <div className="w-2/5 h-2.5 bg-slate-200/70 dark:bg-white/[0.04] rounded" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-transparent rounded-xl p-2">
                <div className="w-10 h-2 bg-slate-200 dark:bg-white/[0.06] rounded mb-1.5" />
                <div className="w-16 h-3 bg-purple-500/20 dark:bg-[#8B5CF6]/30 rounded" />
              </div>
              <div className="h-12 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-transparent rounded-xl p-2">
                <div className="w-10 h-2 bg-slate-200 dark:bg-white/[0.06] rounded mb-1.5" />
                <div className="w-16 h-3 bg-emerald-500/20 dark:bg-[#00E599]/30 rounded" />
              </div>
            </div>
          </div>

          {/* Animated Cursor Moving & Clicking */}
          <motion.div
            className="absolute z-20 pointer-events-none"
            animate={{
              x: [40, 200, 280, 220, 50],
              y: [30, 60, 110, 85, 30],
            }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="#00E599"
                stroke="#090D14"
                strokeWidth="1.5"
              />
            </svg>
            <motion.span
              className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-emerald-500/40 dark:bg-[#00E599]/40"
              animate={{ scale: [0.5, 1.8, 0.5], opacity: [0.9, 0, 0.9] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Video Scrubber & Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-[#00E599] text-white dark:text-[#090D14] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity shadow-xs"
          >
            {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          {/* Scrubber bar */}
          <div className="flex-1 bg-slate-200 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-emerald-600 dark:bg-[#00E599] rounded-full transition-all"
              style={{ width: `${(sec / 138) * 100}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-t-secondary shrink-0">
            {format(sec)} / 2:18
          </span>
        </div>
      </div>
    </FeatureCard>
  );
}
