import React from 'react';
import { motion } from 'framer-motion';

export default function Stats() {
  return (
    <section className="border-y border-border-light py-24 bg-surface-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-container-max mx-auto px-margin-desktop flex flex-col items-start gap-8"
      >
        {/* Content */}
        <div className="max-w-3xl">
          <h2 className="font-display-lg text-[48px] leading-[1.1] text-text-primary mb-6">
            An essential tool<br />for essentially any team.
          </h2>
          <p className="font-body-lg text-body-lg text-text-secondary mb-10">
            Say goodbye to your clunky Slack channels, and hello to a streamlined, user-friendly tool that lets you focus on what matters most.
          </p>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[image:--tw-accent-gradient] text-surface-white font-bold px-8 py-4 rounded-xl shadow-[0_4px_14px_0_rgba(241,89,42,0.39)] flex items-center gap-2"
            style={{ backgroundImage: 'linear-gradient(135deg, rgb(241, 89, 42) 0%, rgb(247, 148, 29) 100%)' }}
          >
            <span className="font-label-md">Start Tracking</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
