import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logoWhite from '../assets/logo-white.png';
import logoBlack from '../assets/logo-black.png';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { DOCS_URL, GITHUB_URL } from '../lib/config';

export default function Header() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vision-theme');
      if (stored === 'light') return false;
    }
    return true; // Default to dark mode
  });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync theme with html class and localStorage
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      localStorage.setItem('vision-theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('vision-theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-bg-primary/90 backdrop-blur-md shadow-sm border-b border-bdr'
        : 'bg-transparent'
        }`}
    >
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-10 h-16 w-full max-w-[1360px] mx-auto">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-bg-card border border-bdr p-1 transition-all group-hover:border-t-primary/30">
            <img
              src={dark ? logoWhite : logoBlack}
              alt="Vision"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-t-primary">
            Vision
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-t-secondary hover:text-t-primary transition-colors duration-200"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-t-secondary hover:text-t-primary transition-colors duration-200"
          >
            Pricing
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-t-secondary hover:text-t-primary transition-colors duration-200"
          >
            Docs
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-t-secondary hover:text-t-primary transition-colors duration-200"
          >
            GitHub
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light/Dark Mode Toggle (Default Dark) */}
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-t-secondary hover:text-t-primary hover:bg-bg-card transition-all"
            aria-label="Toggle theme"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <Sun className="w-4 h-4 text-sky-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600" />
            )}
          </button>

          <motion.a
            href="#features"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 sm:px-5 py-2 btn-brand-gradient text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer"
          >
            Get started
          </motion.a>

          {/* Mobile menu button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-t-secondary hover:text-t-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open mobile menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-card border-b border-bdr px-6 py-5 flex flex-col gap-4 shadow-xl">
          <a
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-t-secondary hover:text-t-primary py-1"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-t-secondary hover:text-t-primary py-1"
          >
            Pricing
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-t-secondary hover:text-t-primary py-1"
          >
            Docs
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-t-secondary hover:text-t-primary py-1"
          >
            GitHub
          </a>
          <div className="pt-2 border-t border-bdr flex flex-col gap-3">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                setMobileOpen(false);
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-bold text-sky-600 dark:text-sky-400"
            >
              Get started →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
