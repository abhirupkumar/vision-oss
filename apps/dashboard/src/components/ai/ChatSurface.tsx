'use client';
import React from 'react';
import { Sparkles } from 'lucide-react';

export function ChatSurface(_props?: any) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-border rounded-2xl bg-card">
      <Sparkles className="w-10 h-10 text-primary mb-3" />
      <h3 className="text-lg font-semibold text-foreground">Vision AI Assistant</h3>
      <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
        Natural-language AI querying is available on Vision Cloud. In Community Edition, use standard product analytics, funnels, and retention views.
      </p>
    </div>
  );
}
