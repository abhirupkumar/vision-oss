import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Dark mode banner images
import darkLlmAnalytics from '../assets/banners/dark-mode/llm-analytics.png';
import darkProductAnalytics from '../assets/banners/dark-mode/product-analytics.png';
import darkUnitEconomics from '../assets/banners/dark-mode/unit-economics.png';
import darkUserJourney from '../assets/banners/dark-mode/user-journey.png';

// Light mode banner images
import lightLlmAnalytics from '../assets/banners/light-mode/llm-analytics.png';
import lightProductAnalytics from '../assets/banners/light-mode/product-analytics.png';
import lightUnitEconomics from '../assets/banners/light-mode/unit-economics.png';
import lightUserJourney from '../assets/banners/light-mode/user-journey.png';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  darkImage: string;
  lightImage: string;
}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'llm-analytics',
    title: 'LLM Observability & Token Metrics',
    subtitle: 'Trace token consumption, latency, error rates, and per-model costs in real time',
    href: '#llm-analytics',
    darkImage: darkLlmAnalytics,
    lightImage: lightLlmAnalytics,
  },
  {
    id: 'product-analytics',
    title: 'Product Analytics & Event Tracking',
    subtitle: 'Monitor unique visitors, live sessions, feature adoption, and retention curves',
    href: '#product-analytics',
    darkImage: darkProductAnalytics,
    lightImage: lightProductAnalytics,
  },
  {
    id: 'unit-economics',
    title: 'Unit Economics & Customer Margin Engine',
    subtitle: 'Executive scorecard mapping customer revenue to AI cost for true gross margins',
    href: '#unit-economics',
    darkImage: darkUnitEconomics,
    lightImage: lightUnitEconomics,
  },
  {
    id: 'user-journey',
    title: 'Interactive User Journeys & Flow Maps',
    subtitle: 'Visualize customer navigation paths, drop-off funnels, and conversion steps',
    href: '#product-analytics',
    darkImage: darkUserJourney,
    lightImage: lightUserJourney,
  },
];

/**
 * Reactively track whether dark mode is currently active on documentElement
 */
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          updateTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    window.addEventListener('storage', updateTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  return isDark;
}

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isDark = useIsDarkMode();
  const touchStartX = useRef<number | null>(null);

  // Preload all banners on mount for instantaneous transitions
  useEffect(() => {
    BANNER_SLIDES.forEach((slide) => {
      const dImg = new Image();
      dImg.src = slide.darkImage;
      const lImg = new Image();
      lImg.src = slide.lightImage;
    });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  // Auto-play carousel every 4.8s, pauses on hover
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4800);
    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const currentSlide = BANNER_SLIDES[currentIndex];

  return (
    <div
      className="relative w-full flex flex-col items-center select-none pt-2 sm:pt-4 pb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Perspective Stage Container */}
      <div className="hero-banner-perspective relative w-full flex justify-center">
        {/* Atmospheric ambient glow behind the tilted banner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[100%] rounded-full bg-gradient-to-tr from-sky-500/10 via-slate-500/5 to-transparent blur-[80px] sm:blur-[110px] pointer-events-none -z-10" />

        {/* 3D Tilted Card Stage */}
        <div className="hero-banner-stage relative w-full max-w-[820px] xl:max-w-[890px]">
          {/* Dashboard Canvas Wrapper */}
          <div className="relative w-full aspect-[1920/945] overflow-hidden bg-bg-primary shadow-2xl transition-all">

            {/* Top and Left Light-Catching Highlight Borders */}
            <div className="absolute inset-0 pointer-events-none border-t border-l border-slate-300/60 dark:border-white/10 z-40" />

            {/* Fading Carousel Images with Crossfade */}
            <AnimatePresence mode="sync">
              <motion.img
                key={`${currentSlide.id}-${isDark ? 'dark' : 'light'}`}
                src={isDark ? currentSlide.darkImage : currentSlide.lightImage}
                alt={currentSlide.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full object-cover object-left-top select-none pointer-events-none"
                draggable={false}
              />
            </AnimatePresence>

            {/* ─── BLURRY & FADING RIGHT EDGE AND BOTTOM OVERLAYS ─── */}

            {/* 1. Progressive Right Edge Blur */}
            <div
              className="absolute inset-y-0 right-0 w-[42%] pointer-events-none z-10"
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 30%, black 85%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 30%, black 85%)',
              }}
            />

            {/* 2. Progressive Right Edge Color Fade to Page Background */}
            <div
              className="absolute inset-y-0 right-0 w-[42%] pointer-events-none z-15"
              style={{
                background: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0) 8%, var(--bg-primary) 82%, var(--bg-primary) 100%)',
              }}
            />

            {/* 3. Progressive Bottom Edge Blur */}
            <div
              className="absolute inset-x-0 bottom-0 h-[44%] pointer-events-none z-10"
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, black 85%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, black 85%)',
              }}
            />

            {/* 4. Progressive Bottom Edge Color Fade to Page Background */}
            <div
              className="absolute inset-x-0 bottom-0 h-[44%] pointer-events-none z-15"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0) 8%, var(--bg-primary) 82%, var(--bg-primary) 100%)',
              }}
            />

            {/* 5. Deep Bottom-Right Corner Radial Blur & Dissolve */}
            <div
              className="absolute bottom-0 right-0 w-[62%] h-[62%] pointer-events-none z-20"
              style={{
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                maskImage: 'radial-gradient(circle at bottom right, black 45%, rgba(0,0,0,0.4) 75%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle at bottom right, black 45%, rgba(0,0,0,0.4) 75%, transparent 100%)',
                background: 'radial-gradient(ellipse at bottom right, var(--bg-primary) 50%, transparent 95%)',
              }}
            />

            {/* 6. Right Edge Soft Blend Layer */}
            <div
              className="absolute inset-y-0 right-0 w-24 sm:w-36 pointer-events-none z-25"
              style={{
                background: 'linear-gradient(to right, transparent 0%, var(--bg-primary) 95%)',
              }}
            />

            {/* 7. Bottom Edge Soft Blend Layer */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 sm:h-24 pointer-events-none z-25"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, var(--bg-primary) 95%)',
              }}
            />

            {/* 8. End Flush Covers ensuring zero hard edges on right and bottom */}
            <div
              className="absolute inset-y-0 right-0 w-4 sm:w-6 pointer-events-none z-30"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-3 sm:h-5 pointer-events-none z-30"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Caption & Carousel Controls under the banner */}
      <div className="relative z-30 mt-6 sm:mt-7 flex flex-col items-center justify-center gap-2.5">
        {/* Caption Title */}
        <motion.a
          key={currentSlide.id}
          href={currentSlide.href}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xs sm:text-sm font-medium text-t-secondary hover:text-t-primary transition-colors text-center tracking-wide"
        >
          {currentSlide.title}
        </motion.a>

        {/* Carousel Navigation: Arrow Left, Dots, Arrow Right */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          {/* Previous Arrow Button */}
          <button
            onClick={prevSlide}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-200/70 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.14] text-t-secondary hover:text-t-primary transition-all border border-slate-300/40 dark:border-white/[0.06] shadow-xs active:scale-95"
            aria-label="Previous banner"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator matching reference screenshot */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-1">
            {BANNER_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${idx === currentIndex
                  ? 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-slate-900 dark:bg-white scale-110 shadow-xs'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40'
                  }`}
                aria-label={`Jump to ${slide.title}`}
                title={slide.title}
              />
            ))}
          </div>

          {/* Next Arrow Button */}
          <button
            onClick={nextSlide}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-200/70 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.14] text-t-secondary hover:text-t-primary transition-all border border-slate-300/40 dark:border-white/[0.06] shadow-xs active:scale-95"
            aria-label="Next banner"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
