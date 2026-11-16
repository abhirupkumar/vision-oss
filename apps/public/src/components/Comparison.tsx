import React from 'react';
import { motion } from 'framer-motion';

export default function Comparison() {
  return (
    <section className="py-24 bg-surface-bright border-t border-border-light">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        {/* Header Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-start mb-16"
        >
          <h2 className="font-display-lg text-headline-xl text-text-primary mb-6 max-w-3xl">
            Get instant insights into your KPIs and important metrics.
          </h2>
          <p className="font-body-lg text-text-secondary max-w-2xl">
            We made it easy to create realtime dashboards for your metrics. Be it your daily active users, revenue, server status, or anything else.
          </p>
        </motion.div>

        {/* Dashboard Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative bg-surface-white border border-border-light rounded-xl shadow-2xl overflow-hidden flex min-h-[600px] flex-col md:flex-row"
        >
          {/* Sidebar */}
          <div className="w-full md:w-64 border-r border-border-light bg-surface-bright p-6 flex flex-col gap-8">
            <div className="flex items-center gap-3 text-text-primary font-semibold">
              <span className="material-symbols-outlined">grid_view</span>
              <span>quickshop</span>
              <span className="material-symbols-outlined ml-auto text-text-secondary text-[18px]">settings</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 p-2 text-text-secondary hover:bg-surface-subtle rounded transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">rss_feed</span>
                <span className="text-body-md">feed</span>
              </div>
              <div className="flex items-center gap-3 p-2 text-text-secondary hover:bg-surface-subtle rounded transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                <span className="text-body-md">charts</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-primary/10 text-primary rounded font-semibold">
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                <span className="text-body-md">insight</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-text-secondary mb-4">
                <span className="text-label-xs uppercase tracking-wider">channels</span>
                <span className="material-symbols-outlined text-[18px] cursor-pointer">add</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-secondary text-body-sm">
                  <span className="opacity-60">#</span> signups
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-body-sm">
                  <span className="opacity-60">#</span> orders
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-body-sm">
                  <span className="opacity-60">#</span> billing
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-surface-white">
            <div className="p-6 border-b border-border-light flex justify-between items-center">
              <h3 className="font-semibold text-text-primary">insight</h3>
              <span className="material-symbols-outlined text-text-secondary">tune</span>
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Metric Card 1 */}
              <div className="bg-surface-bright border border-border-light rounded-lg p-6 relative hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 w-6 h-6 bg-error rounded-full animate-pulse"></div>
                <div className="text-[32px] font-bold text-text-primary mb-1">28</div>
                <div className="text-text-secondary text-body-sm">online</div>
              </div>

              {/* Metric Card 2 */}
              <div className="bg-surface-bright border border-border-light rounded-lg p-6 relative hover:shadow-md transition-shadow">
                <span className="absolute top-4 right-4 material-symbols-outlined text-[#F7941D] text-[24px]">light_mode</span>
                <div className="text-[32px] font-bold text-text-primary mb-1">$1,449</div>
                <div className="text-text-secondary text-body-sm">24h sales</div>
              </div>

              {/* Metric Card 3 */}
              <div className="bg-surface-bright border border-border-light rounded-lg p-6 relative hover:shadow-md transition-shadow">
                <span className="absolute top-4 right-4 material-symbols-outlined text-primary text-[24px]">local_shipping</span>
                <div className="text-[32px] font-bold text-text-primary mb-1">12</div>
                <div className="text-text-secondary text-body-sm">orders in transit</div>
              </div>

              {/* Metric Card 4 */}
              <div className="bg-surface-bright border border-border-light rounded-lg p-6 relative hover:shadow-md transition-shadow">
                <span className="absolute top-4 right-4 material-symbols-outlined text-error text-[24px]">factory</span>
                <div className="text-[32px] font-bold text-text-primary mb-1">23</div>
                <div className="text-text-secondary text-body-sm">orders processing</div>
              </div>

              {/* Bottom Row */}
              <div className="bg-surface-bright border border-border-light rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-[32px] font-bold text-text-primary mb-1">26.321</div>
                <div className="text-text-secondary text-body-sm">total users</div>
              </div>
              <div className="bg-surface-bright border border-border-light rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-[32px] font-bold text-text-primary mb-1">$23.230</div>
                <div className="text-text-secondary text-body-sm">total revenue</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
