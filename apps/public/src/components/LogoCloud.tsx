import React from 'react';

const logos = [
  { name: 'Anthropic', icon: '🤖' },
  { name: 'Google', icon: '🔷' },
  { name: 'Vercel', icon: '▲' },
  { name: 'Supabase', icon: '⚡' },
  { name: 'Paddle', icon: '🏄' },
  { name: 'Resend', icon: '📧' },
  { name: 'Clerk', icon: '🔑' },
  { name: 'Neon', icon: '⚡' },
  { name: 'Next.js', icon: '▲' },
  { name: 'Langchain', icon: '🔗' },
  { name: 'Stripe', icon: '💳' },
  { name: 'OpenAI', icon: '⚡' },
];

export default function LogoCloud() {
  return (
    <section className="py-12 sm:py-16">
      {/* Centered, constrained container - not full width */}
      <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-purple-600 dark:text-[#A78BFA] font-semibold mb-7">
          INTEGRATES WITH THE MODERN AI & FINANCE STACK
        </p>

        {/* Constrained Marquee Wrapper with Deep Blur Edge Fades */}
        <div className="relative overflow-hidden rounded-3xl py-2">
          {/* Left Blur & Gradient Fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-36 md:w-44 bg-gradient-to-r from-bg-primary via-bg-primary/95 to-transparent z-20 backdrop-blur-[1.5px]" />
          
          {/* Right Blur & Gradient Fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-36 md:w-44 bg-gradient-to-l from-bg-primary via-bg-primary/95 to-transparent z-20 backdrop-blur-[1.5px]" />

          {/* Scrolling Logos */}
          <div
            className="flex gap-4 sm:gap-6 w-max items-center"
            style={{ animation: 'scroll-left 28s linear infinite' }}
          >
            {[...logos, ...logos, ...logos].map((logo, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-bg-card text-t-secondary hover:text-t-primary transition-all shrink-0 shadow-sm border border-bdr"
              >
                <span className="text-sm sm:text-base">{logo.icon}</span>
                <span className="text-xs sm:text-sm font-medium tracking-tight">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
