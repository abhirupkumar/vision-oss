'use client';

import { ChevronDown, GripVertical, Play, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';

export interface FunnelStep {
  id: string;
  type: 'path' | 'event';
  value: string;
}

export function FunnelStepBuilder({
  steps,
  onChange,
}: {
  steps: FunnelStep[];
  onChange: (steps: FunnelStep[]) => void;
}) {
  const uid = useId();

  const addStep = () => {
    onChange([...steps, { id: `${uid}-${Date.now()}`, type: 'path', value: '' }]);
  };

  const removeStep = (id: string) => {
    onChange(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, patch: Partial<FunnelStep>) => {
    onChange(steps.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-semibold text-foreground">Funnel Steps</Label>
        <span className="text-xs text-muted-foreground">
          {steps.length} step{steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {steps.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
          Add at least 2 steps to define your funnel
        </div>
      )}

      {steps.map((step, index) => (
        <div key={step.id} className="group flex items-center gap-2">
          {/* Step number */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </div>

          {/* Drag handle (visual only) */}
          <GripVertical size={14} className="shrink-0 text-muted-foreground/40" />

          {/* Type selector */}
          <div className="relative">
            <select
              value={step.type}
              onChange={e => updateStep(step.id, { type: e.target.value as 'path' | 'event' })}
              className={cn(
                'h-9 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
                'cursor-pointer hover:bg-accent transition-colors',
              )}
            >
              <option value="path">Page URL</option>
              <option value="event">Event</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          {/* Value input */}
          <Input
            className="flex-1 h-9 text-sm"
            placeholder={step.type === 'path' ? '/page-path or /path/*' : 'event_name'}
            value={step.value}
            onChange={e => updateStep(step.id, { value: e.target.value })}
          />

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeStep(step.id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Connector line between steps */}
      {steps.length > 0 && <div className="ml-3 h-4 w-px bg-border" />}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStep}
        className="w-full border-dashed text-muted-foreground hover:text-foreground hover:border-primary/50"
      >
        <Plus size={14} className="mr-2" />
        Add Step
      </Button>
    </div>
  );
}
