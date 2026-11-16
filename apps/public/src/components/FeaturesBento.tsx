import React from 'react';
import { Activity, Lock, Zap, BarChart3, Users, Globe2 } from 'lucide-react';

export default function FeaturesBento() {
  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Everything you need, nothing you don't
          </h2>
          <p className="text-lg text-gray-500">
            A comprehensive suite of analytics tools designed for modern teams. Built to be fast, beautiful, and completely respectful of user privacy.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {/* Large Card 1 */}
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group p-8 flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 className="w-32 h-32" />
            </div>
            <div className="mt-auto">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Real-time Insights</h3>
              <p className="text-gray-500 max-w-sm">Watch your traffic, events, and conversions update in milliseconds. No more waiting for daily aggregations.</p>
            </div>
          </div>

          {/* Small Card 1 */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group p-8 flex flex-col">
            <div className="mt-auto">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Built-in</h3>
              <p className="text-gray-500">GDPR & CCPA compliant out of the box. We don't use cookies or collect PII.</p>
            </div>
          </div>

          {/* Small Card 2 */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group p-8 flex flex-col">
            <div className="mt-auto">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-500">A tiny 1KB script that won't slow down your website or affect SEO scores.</p>
            </div>
          </div>

          {/* Large Card 2 */}
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-black text-white border border-gray-800 shadow-xl group p-8 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-transparent opacity-50"></div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-32 h-32" />
            </div>
            <div className="mt-auto relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Advanced User Journeys</h3>
              <p className="text-gray-400 max-w-sm">Understand exactly how users navigate your app. Map out complex funnels, drop-offs, and conversion points with zero configuration.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
