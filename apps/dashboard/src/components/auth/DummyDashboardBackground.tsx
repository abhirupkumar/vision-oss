import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Globe,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

export function DummyDashboardBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0 bg-background"
    >
      {/* Ambient background glows for depth and polish */}
      <div className="absolute -top-40 right-[-10%] w-170 h-170 rounded-full bg-sky-500/10 dark:bg-sky-400/10 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 left-[-10%] w-170 h-170 rounded-full bg-slate-500/10 dark:bg-slate-700/15 blur-[150px] pointer-events-none" />

      {/* Blurred Dummy Dashboard Canvas */}
      <div className="w-360 min-h-screen mx-auto p-4 md:p-6 flex gap-6 filter blur-[6px] md:blur-[7px] scale-[1.02] transform origin-top opacity-85 dark:opacity-75 transition-all">
        {/* Left Sidebar Mockup */}
        <aside className="w-64 shrink-0 flex flex-col gap-6 rounded-2xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 p-5 shadow-sm">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-card border border-border p-1.5 flex items-center justify-center shadow-xs">
              <img src="/logo-black.png" className="w-full h-full object-contain block dark:hidden" alt="Vision" />
              <img src="/logo-white.png" className="w-full h-full object-contain hidden dark:block" alt="Vision" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                Vision
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Analytics Platform
              </span>
            </div>
          </div>

          {/* Workspace Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Acme Production
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
          </div>

          {/* Navigation Links */}
          <div className="space-y-5 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3">
                Analytics
              </span>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 text-xs">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Realtime</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  342
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 dark:text-zinc-400 text-xs">
                <Layers className="w-4 h-4" />
                <span>Funnels & Paths</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 dark:text-zinc-400 text-xs">
                <Users className="w-4 h-4" />
                <span>Retention Cohorts</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3">
                Insights
              </span>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 dark:text-zinc-400 text-xs">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>AI Anomalies</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 dark:text-zinc-400 text-xs">
                <Globe className="w-4 h-4" />
                <span>Global Traffic</span>
              </div>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/60">
            <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              <span>Monthly Quota</span>
              <span>4.8M / 10M</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div className="w-[48%] h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full" />
            </div>
          </div>
        </aside>

        {/* Main Content Area Mockup */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Header Bar */}
          <header className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <span>production-app.io</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  Live
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 text-xs text-slate-400 dark:text-zinc-400 w-64">
                <Search className="w-3.5 h-3.5" />
                <span>Search metrics or paths...</span>
                <span className="ml-auto text-[10px] bg-white dark:bg-zinc-700 px-1 rounded shadow-2xs">
                  ⌘K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>342 Online Now</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Oct 1 – Oct 31, 2026</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter</span>
              </div>
            </div>
          </header>

          {/* Metric KPI Cards Grid */}
          <div className="grid grid-cols-5 gap-4">
            {/* Card 1 */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Unique Visitors
                </span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 14.8%
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                184,290
              </div>
              {/* Mini Sparkline SVG */}
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 30">
                <path
                  d="M0,25 Q20,20 40,22 T80,10 T120,4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Total Pageviews
                </span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 22.4%
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                642,810
              </div>
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 30">
                <path
                  d="M0,28 Q30,12 60,18 T100,8 T120,2"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Visit Duration
                </span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8.2%
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                3m 48s
              </div>
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 30">
                <path
                  d="M0,22 Q30,24 60,15 T90,12 T120,6"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Card 4 */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Bounce Rate
                </span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowDownRight className="w-3 h-3 mr-0.5" /> 3.6%
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                26.4%
              </div>
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 30">
                <path
                  d="M0,8 Q30,12 60,18 T90,20 T120,26"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Card 5 */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Goal Conversion
                </span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> 1.4%
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                4.92%
              </div>
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 120 30">
                <path
                  d="M0,26 Q30,22 60,16 T90,12 T120,4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Main Analytics Chart Card */}
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visitor Traffic & Engagement Over Time
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Daily comparison of unique sessions and total pageviews
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 dark:text-zinc-300 font-medium">
                      Unique Visitors
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-600 dark:text-zinc-300 font-medium">
                      Pageviews
                    </span>
                  </div>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200/70 dark:border-zinc-700/60 text-xs">
                  <span className="px-2.5 py-1 rounded-md text-slate-600 dark:text-zinc-400">
                    Hourly
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-700 font-semibold text-slate-900 dark:text-white shadow-2xs">
                    Daily
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-slate-600 dark:text-zinc-400">
                    Weekly
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Area Chart */}
            <div className="w-full h-56 relative">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 1000 220"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line
                  x1="0"
                  y1="30"
                  x2="1000"
                  y2="30"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-zinc-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="85"
                  x2="1000"
                  y2="85"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-zinc-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="140"
                  x2="1000"
                  y2="140"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-zinc-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="195"
                  x2="1000"
                  y2="195"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-zinc-800"
                  strokeWidth="1"
                />

                {/* Series 2 (Indigo Pageviews) */}
                <path
                  d="M0,150 C100,120 180,160 280,100 C380,40 460,90 560,70 C660,50 740,110 840,45 C920,-5 960,30 1000,20 L1000,195 L0,195 Z"
                  fill="url(#indigoGrad)"
                />
                <path
                  d="M0,150 C100,120 180,160 280,100 C380,40 460,90 560,70 C660,50 740,110 840,45 C920,-5 960,30 1000,20"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Series 1 (Emerald Visitors) */}
                <path
                  d="M0,175 C100,150 180,180 280,135 C380,85 460,130 560,110 C660,95 740,145 840,80 C920,35 960,65 1000,50 L1000,195 L0,195 Z"
                  fill="url(#emeraldGrad)"
                />
                <path
                  d="M0,175 C100,150 180,180 280,135 C380,85 460,130 560,110 C660,95 740,145 840,80 C920,35 960,65 1000,50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Pinned Tooltip Mockup at peak */}
                <line
                  x1="840"
                  y1="20"
                  x2="840"
                  y2="195"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle cx="840" cy="80" r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                <circle cx="840" cy="45" r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
              </svg>

              {/* Tooltip Card Overlay */}
              <div className="absolute top-2 right-36 bg-slate-900/90 dark:bg-zinc-800/95 border border-slate-700/80 dark:border-zinc-700 text-white p-2.5 rounded-xl shadow-lg text-[11px] backdrop-blur-md">
                <span className="font-semibold block text-slate-300 dark:text-zinc-300">
                  Oct 24, 2026
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>14,210 Visitors</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>28,450 Pageviews</span>
                </div>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 mt-2 px-1">
              <span>Oct 1</span>
              <span>Oct 6</span>
              <span>Oct 11</span>
              <span>Oct 16</span>
              <span>Oct 21</span>
              <span>Oct 26</span>
              <span>Oct 31</span>
            </div>
          </div>

          {/* Bottom Grid: 3 Breakdown Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Top Pages */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Top Visited Pages
                </h4>
                <span className="text-[10px] text-slate-400">Views</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { path: '/dashboard/overview', views: '142.8k', pct: '78%' },
                  { path: '/pricing', views: '89.4k', pct: '52%' },
                  { path: '/docs/quickstart', views: '54.2k', pct: '36%' },
                  { path: '/features/realtime', views: '46.1k', pct: '28%' },
                  { path: '/blog/release-v2', views: '29.3k', pct: '19%' },
                ].map(item => (
                  <div key={item.path} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-slate-700 dark:text-zinc-300 truncate max-w-42.5">
                        {item.path}
                      </span>
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {item.views}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: item.pct }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referrers */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Top Referrers
                </h4>
                <span className="text-[10px] text-slate-400">Share</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { src: 'google.com (Organic)', pct: '44%', width: '75%', color: 'bg-emerald-500' },
                  { src: 'direct / bookmark', pct: '28%', width: '50%', color: 'bg-indigo-500' },
                  { src: 'github.com', pct: '14%', width: '28%', color: 'bg-purple-500' },
                  { src: 'twitter.com / x', pct: '8%', width: '16%', color: 'bg-cyan-500' },
                  { src: 'news.ycombinator.com', pct: '5%', width: '10%', color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.src} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 dark:text-zinc-300 truncate max-w-42.5">
                        {item.src}
                      </span>
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {item.pct}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic & Devices */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#111827]/70 border border-slate-200/90 dark:border-zinc-800/80 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Top Countries
                </h4>
                <span className="text-[10px] text-slate-400">Traffic</span>
              </div>
              <div className="space-y-2">
                {[
                  { flag: '🇺🇸', name: 'United States', share: '41.6%' },
                  { flag: '🇩🇪', name: 'Germany', share: '17.2%' },
                  { flag: '🇬🇧', name: 'United Kingdom', share: '13.8%' },
                  { flag: '🇯🇵', name: 'Japan', share: '9.4%' },
                  { flag: '🇨🇦', name: 'Canada', share: '6.8%' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.flag}</span>
                      <span className="text-slate-700 dark:text-zinc-300 font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">
                      {item.share}
                    </span>
                  </div>
                ))}
              </div>

              {/* Devices pill footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-zinc-800 flex justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span>💻 Desktop 68%</span>
                <span>📱 Mobile 27%</span>
                <span>📟 Tablet 5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frosted Glass Scrim Overlay (Smooth backdrop blur over the dummy dashboard) */}
      <div className="absolute inset-0 bg-white/40 dark:bg-[#090D14]/60 backdrop-blur-[5px] pointer-events-none z-1" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none z-1"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}
