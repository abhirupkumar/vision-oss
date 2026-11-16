import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface BetterStackSectionProps {
  id: string;
  tag?: string;
  tagColor?: string;
  title: string;
  exploreText?: string;
  exploreHref?: string;
  description?: string;
  children: React.ReactNode;
}

export default function BetterStackSection({
  id,
  tag,
  tagColor = 'text-primary',
  title,
  exploreText = `Explore ${title}`,
  exploreHref = '#',
  description,
  children,
}: BetterStackSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 340 : 560;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id={id} className="py-16 sm:py-20 md:py-24 overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
          {/* Left Title */}
          <div>
            {tag && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-card border border-bdr text-[11px] sm:text-xs font-semibold mb-2.5 sm:mb-3 ${tagColor}`}>
                {tag}
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl md:text-[38px] lg:text-[42px] font-bold tracking-tight text-t-primary leading-[1.15]">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm md:text-base text-t-secondary mt-2 max-w-xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Right Navigation & Explore */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start md:self-end">
            {/* Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-bg-card border border-bdr flex items-center justify-center text-t-secondary hover:text-t-primary hover:bg-bg-card-hover transition-colors shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-bg-card border border-bdr flex items-center justify-center text-t-secondary hover:text-t-primary hover:bg-bg-card-hover transition-colors shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 sm:h-5 w-px bg-bdr hidden sm:block" />

            {/* Explore Pill Button */}
            <a
              href={exploreHref}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-bg-card border border-bdr text-xs sm:text-sm font-semibold text-t-primary hover:text-primary transition-all shadow-sm"
            >
              <span>{exploreText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div className="relative">
        {/* Smooth edge blur fades so cards appear to emerge from screen edge */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-14 md:w-20 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-14 md:w-20 bg-gradient-to-l from-bg-primary via-bg-primary/80 to-transparent z-10" />

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 md:px-10 max-w-[1360px] mx-auto pb-4 sm:pb-6"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export function FeatureCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="w-[86vw] sm:w-[480px] md:w-[540px] lg:w-[580px] min-h-[480px] sm:h-[540px] shrink-0 rounded-3xl bg-bg-card border border-bdr flex flex-col justify-between p-4 sm:p-6 md:p-8 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl transition-all relative overflow-hidden"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Top Graphic / Live Demo Container (Clean, seamless, adaptive) */}
      <div className="w-full h-[300px] sm:h-[340px] md:h-[360px] rounded-2xl bg-slate-100/80 dark:bg-[#070A11] border border-slate-200/80 dark:border-white/[0.05] overflow-hidden relative flex flex-col justify-center">
        {children}
      </div>

      {/* Bottom Description */}
      <div className="pt-3 sm:pt-4 md:pt-5 flex flex-col justify-end">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-t-primary mb-1 sm:mb-2 line-clamp-1">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-t-secondary leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
