import React from 'react';
import logoWhite from '../assets/logo-white.png';
import logoBlack from '../assets/logo-black.png';
import { DOCS_URL, GITHUB_URL } from '../lib/config';

export default function Footer() {
  return (
    <footer className="pt-16 sm:pt-20 pb-12 bg-bg-secondary border-t border-bdr">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12 sm:mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <div className="text-xl font-bold text-t-primary mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-card border border-bdr p-1">
                <img src={logoBlack} alt="Vision" className="w-full h-full object-contain block dark:hidden" />
                <img src={logoWhite} alt="Vision" className="w-full h-full object-contain hidden dark:block" />
              </div>
              <span>Vision</span>
            </div>
            <p className="text-sm text-t-secondary max-w-xs mb-8 leading-relaxed">
              The AI Business Observability Platform. Know what your users do, what your AI costs, and what makes you money.
            </p>
            <div className="flex flex-col gap-3">
              <span className="text-xs text-t-muted uppercase tracking-wider font-semibold">Get product updates</span>
              <div className="flex gap-2">
                <input
                  className="bg-bg-card border border-bdr px-4 py-2.5 rounded-full text-sm outline-none flex-1 text-t-primary placeholder:text-t-muted focus:border-accent"
                  placeholder="you@company.com"
                  type="email"
                />
                <button className="btn-brand-gradient px-5 py-2.5 rounded-full text-sm font-bold shadow-md">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-t-primary mb-5">Product</h5>
            <ul className="space-y-3">
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href={DOCS_URL} target="_blank" rel="noopener noreferrer">Docs</a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href="#pricing">Pricing</a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href={DOCS_URL + '/self-hosted'} target="_blank" rel="noopener noreferrer">Self-Hosting</a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub (OSS)</a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-t-primary mb-5">Features</h5>
            <ul className="space-y-3">
              {['Product Analytics', 'LLM Observability', 'Revenue Analytics', 'Unit Economics', 'A/B Testing', 'Ask AI'].map(item => (
                <li key={item}>
                  <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href="#">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-t-primary mb-5">Company</h5>
            <ul className="space-y-3">
              {['Blog', 'Manifesto', 'Status', 'Security', 'GDPR'].map(item => (
                <li key={item}>
                  <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href="#">{item}</a>
                </li>
              ))}
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href="/terms">Terms & Conditions</a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors" href="/refunds">Refund Policy</a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-t-primary mb-5">Connect</h5>
            <ul className="space-y-3">
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors flex items-center gap-2" href="#">
                  <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                  support@vision.dev
                </a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors flex items-center gap-2" href="#">
                  <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
                  Discord
                </a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors flex items-center gap-2" href="#">
                  <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Twitter / X
                </a>
              </li>
              <li>
                <a className="text-sm text-t-secondary hover:text-t-primary transition-colors flex items-center gap-2" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-bdr">
          <div className="flex items-center gap-6">
            <span className="text-xs text-t-muted">© {new Date().getFullYear()} Vision Analytics. All rights reserved.</span>
            <div className="flex gap-3">
              <span className="px-2 py-0.5 rounded-full bg-bg-card border border-bdr font-bold text-[10px] text-t-muted">GDPR</span>
              <span className="px-2 py-0.5 rounded-full bg-bg-card border border-bdr font-bold text-[10px] text-t-muted">CCPA</span>
              <span className="px-2 py-0.5 rounded-full bg-bg-card border border-bdr font-bold text-[10px] text-t-muted">SOC2</span>
            </div>
          </div>
          <div className="flex gap-6 text-xs text-t-muted">
            <a className="hover:text-t-primary transition-colors" href="#">Privacy</a>
            <a className="hover:text-t-primary transition-colors" href="/refunds">Refund Policy</a>
            <a className="hover:text-t-primary transition-colors" href="/terms">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
