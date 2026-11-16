import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function InsightOverviewFloat({ 
  projectId 
}: { 
  projectId: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [insightCount, setInsightCount] = useState(0);

  useEffect(() => {
    // Fetch open insights
    fetch(`/api/insights?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setInsightCount(data.data.length);
        }
      })
      .catch(err => console.error('Failed to fetch insights', err));
  }, [projectId]);

  if (dismissed || insightCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex w-72 flex-col gap-3 rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles size={12} />
            </div>
            AI Insights
          </div>
          <button 
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Vision AI detected <strong className="text-foreground">{insightCount} unusual patterns</strong> in your analytics today.
        </p>
        
        <Link 
          href={`/${projectId}/insights`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View Insights
        </Link>
      </div>
    </div>
  );
}
