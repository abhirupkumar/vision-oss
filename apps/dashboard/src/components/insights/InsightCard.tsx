"use client";

import React, { useState } from 'react';
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface InsightMetric {
  label: string;
  current: number;
  previous?: number;
  format: 'number' | 'percent' | 'duration_ms' | 'currency';
}

export interface InsightAction {
  type: string;
  label: string;
  params: Record<string, string>;
}

export interface InsightCardProps {
  insight: {
    id: string;
    title: string;
    description: string;
    suggestion: string;
    severity: 'critical' | 'warning' | 'info';
    type: string;
    metrics?: InsightMetric[];
    actions?: InsightAction[];
  };
  projectId: string;
}

const TYPE_STYLES = {
  critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
  warning: { icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
};

export function InsightCard({ insight, projectId }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[insight.severity] || TYPE_STYLES.info;
  const Icon = style.icon;

  return (
    <div className="group flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 rounded-full p-1.5', style.bg, style.color)}>
            <Icon size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-medium leading-none">{insight.title}</h3>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Hide Details' : 'View Details'}
          <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {/* CSS grid transition trick for smooth expanding */}
      <div className={cn("grid transition-all duration-200 ease-in-out", expanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0")} aria-hidden={!expanded}>
        <div className="overflow-hidden flex flex-col gap-4" inert={expanded ? undefined : true}>
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              AI Suggestion
            </h4>
            <p className="text-sm text-muted-foreground">{insight.suggestion}</p>
          </div>

          {insight.actions && insight.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {insight.actions.map((action, i) => {
                if (action.type === 'investigate_further') {
                  return (
                    <Link 
                      key={i}
                      href={`/${projectId}/nlq?q=${encodeURIComponent(action.params.prompt || '')}&insightId=${insight.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      Ask Agent <ArrowRight size={12} />
                    </Link>
                  );
                }
                return (
                  <button key={i} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
