import Link from 'next/link';
import type React from 'react';
import { DummyDashboardBackground } from '@/components/auth/DummyDashboardBackground';
import { AuthThemeToggle } from '@/components/auth/AuthThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-200">
      {/* Blurred Dummy Dashboard in the background */}
      <DummyDashboardBackground />

      {/* Top Bar with Brand Link and Theme Toggle */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform hover:opacity-90"
        >
          <div className="w-9 h-9 rounded-xl bg-card border border-border p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <img src="/logo-black.png" className="w-full h-full object-contain block dark:hidden" alt="Vision" />
            <img src="/logo-white.png" className="w-full h-full object-contain hidden dark:block" alt="Vision" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Vision</span>
        </Link>

        <div className="flex items-center gap-3">
          <AuthThemeToggle />
        </div>
      </header>

      {/* Main Centered Auth Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-6">
          <span>© 2026 Vision Analytics</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">
            Privacy
          </span>
          <span className="hover:text-foreground cursor-pointer transition-colors">
            Terms
          </span>
          <span className="hover:text-foreground cursor-pointer transition-colors">
            Security
          </span>
        </div>
      </footer>
    </div>
  );
}
