'use client';
import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function UniversalBillingPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 p-6 rounded-2xl border border-border bg-card">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Community Edition (Self-Hosted)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This instance is running the open-source Vision Community Edition. All event limits, 
            spending caps, and lockouts are disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
