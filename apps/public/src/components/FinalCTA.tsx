import React from 'react';
import { motion } from 'framer-motion';
import logoWhite from '../assets/logo-white.png';
import logoBlack from '../assets/logo-black.png';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { DASHBOARD_URL } from '../lib/config';

export default function FinalCTA() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-10 max-w-[1360px] mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-bg-card border border-bdr min-h-[340px] sm:min-h-[380px] flex items-center shadow-xl"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[350px] bg-sky-500/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-12 lg:p-20 w-full flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
          <div className="max-w-2xl text-center md:text-left">
            <h2 className="text-[32px] sm:text-[44px] md:text-[56px] font-bold tracking-tight leading-[1.1] text-t-primary mb-4 sm:mb-5">
              Start understanding<br />
              <span className="text-gradient">your AI business.</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-t-secondary mb-8 sm:mb-10 max-w-lg leading-relaxed mx-auto md:mx-0">
              Know what your users do, what your AI costs, and what makes you money. Set up in 5 minutes with zero SDK bloat.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3.5">
              <motion.a
                href={DASHBOARD_URL}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 sm:px-8 py-3.5 sm:py-4 btn-brand-gradient font-bold rounded-full text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href={DASHBOARD_URL}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 sm:px-8 py-3.5 sm:py-4 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/10 text-t-primary font-semibold rounded-full text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all text-center"
              >
                See live demo
              </motion.a>
            </div>
            <p className="text-xs text-t-muted mt-5 sm:mt-6 flex items-center justify-center md:justify-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Know your margins, cost-to-serve, and system reliability in one platform.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, rotate: -6 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 80 }}
            className="shrink-0"
          >
            <div className="w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center bg-bg-primary rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-bdr">
              <img alt="Vision" className="w-full h-full object-contain block dark:hidden" src={logoBlack} />
              <img alt="Vision" className="w-full h-full object-contain hidden dark:block" src={logoWhite} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
