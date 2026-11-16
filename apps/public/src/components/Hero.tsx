import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import HeroShowcase from './HeroShowcase';
import { DASHBOARD_URL } from '../lib/config';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export default function Hero() {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');

  const handleStartFree = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = DASHBOARD_URL;
  };

  return (
    <section className="relative min-h-[88vh] lg:min-h-[92vh] flex items-center overflow-hidden">
      {/* Opaque background behind hero text area on desktop so cards never show underneath */}
      <div
        className="hidden lg:block absolute inset-y-0 left-0 w-full lg:w-[50%] xl:w-[47%] bg-bg-primary z-20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="hidden lg:block absolute inset-y-0 left-[35%] lg:left-[48%] xl:left-[45%] w-28 lg:w-44 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Main container with Left Copy */}
      <div className="relative z-30 max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 pb-12 sm:pb-16 w-full pointer-events-none">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left column: Hero copy & Lead capture */}
          <motion.div
            className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center pointer-events-auto relative z-40"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-[11px] sm:text-xs font-semibold mb-5 sm:mb-6 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
              AI Business Observability
            </div>

            <h1 className="text-[38px] sm:text-[52px] md:text-[62px] xl:text-[68px] font-bold tracking-tight leading-[1.06] text-t-primary mb-5 sm:mb-6">
              The AI Business<br />
              <span className="text-gradient">Observability</span><br />
              Stack
            </h1>

            <p className="text-sm sm:text-base md:text-[17px] text-t-secondary leading-relaxed mb-4 max-w-[480px]">
              Unify AI cost tracking, revenue analytics, product analytics, and unit economics. Know your margins in real time.
            </p>

            <p className="text-xs sm:text-sm font-semibold text-t-primary mb-6 sm:mb-8 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              From first prompt to profitable customer.
            </p>

            {/* Email form + CTA button */}
            <form
              onSubmit={handleStartFree}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 max-w-[480px] mb-3.5"
            >
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your work e-mail"
                  className="w-full px-4 sm:px-4.5 py-3 sm:py-3.5 rounded-xl bg-slate-100/90 dark:bg-[#11131A]/90 border border-slate-300/80 dark:border-white/10 text-t-primary text-xs sm:text-sm placeholder:text-t-muted focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:focus:ring-sky-400/30 transition-all shadow-inner"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 sm:px-7 py-3 sm:py-3.5 btn-brand-gradient font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shrink-0"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Switch note */}
            <p className="text-[12px] sm:text-[13px] text-t-muted leading-relaxed max-w-[480px] mb-6 sm:mb-8">
              Datadog or Mixpanel bill too high? Migrate today, the rest of your contract is on us.{' '}
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-xs text-t-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5 text-xs text-t-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                5 min setup
              </div>
              <div className="flex items-center gap-1.5 text-xs text-t-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                GDPR compliant
              </div>
            </div>
          </motion.div>

          {/* Right column placeholder on desktop to maintain grid spacing */}
          <div className="lg:col-span-6 xl:col-span-7 hidden lg:block pointer-events-none" />

          {/* On mobile: HeroShowcase rendered under the Hero copy */}
          {isMobile && (
            <div className="col-span-12 w-full pointer-events-auto relative z-30 mt-8 sm:mt-12">
              <HeroShowcase
                isMobile
                className="relative w-full h-[360px] sm:h-[440px] md:h-[500px] max-w-[560px] sm:max-w-[660px] mx-auto overflow-hidden pointer-events-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* On desktop: HeroShowcase rendered at section level taking full width and height of the right side */}
      {!isMobile && (
        <HeroShowcase
          className="absolute inset-y-0 right-0 left-[42%] xl:left-[45%] h-full w-auto z-10 pointer-events-none overflow-hidden"
        />
      )}
    </section>
  );
}
