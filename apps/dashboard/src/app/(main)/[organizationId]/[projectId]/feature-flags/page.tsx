'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleLeft, Plus, Check, Sparkles, Filter, Code } from 'lucide-react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPct: number;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      key: 'gemini_pro_streaming',
      name: 'Gemini 2.5 Flash Streaming Mode',
      description: 'Stream response tokens directly to client interface for reduced TTFT latency',
      enabled: true,
      rolloutPct: 100,
    },
    {
      key: 'agentic_multi_step_reasoning',
      name: 'Agentic Tool-Calling Fallback',
      description: 'Automatically retry failed tool calls with high-reasoning model',
      enabled: true,
      rolloutPct: 50,
    },
    {
      key: 'semantic_prompt_cache',
      name: 'Semantic Prompt Cache v2',
      description: 'Cache embedding similarity search before triggering LLM generation',
      enabled: false,
      rolloutPct: 0,
    },
  ]);

  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleFlag = (key: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleAddFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newName) return;
    setFlags((prev) => [
      ...prev,
      {
        key: newKey.toLowerCase().replace(/\s+/g, '_'),
        name: newName,
        description: 'Custom rollout flag',
        enabled: true,
        rolloutPct: 100,
      },
    ]);
    setNewKey('');
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Feature Flags"
          description="Manage gradual rollouts and feature toggles. Evaluations stream through Kafka telemetry into Tinybird."
          icon={<ToggleLeft className="h-5 w-5 text-primary" />}
        />
        <Button onClick={() => setIsAdding(!isAdding)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Flag</span>
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Create Feature Flag</CardTitle>
            <CardDescription className="text-xs">Define a key to evaluate in your frontend or backend code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFlag} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Flag Key (e.g. new_checkout_v2)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Display Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Flags</CardTitle>
          <CardDescription>
            Evaluations are tracked with zero PostgreSQL overhead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {flags.map((flag) => (
              <div key={flag.key} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{flag.name}</span>
                    <Badge variant={flag.enabled ? 'outline' : 'secondary'} className={`text-xs ${flag.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}>
                      {flag.enabled ? `${flag.rolloutPct}% Rollout` : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{flag.description}</div>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-muted-foreground">
                    <Code className="h-3 w-3" />
                    <span>{flag.key}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant={flag.enabled ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => toggleFlag(flag.key)}
                  >
                    {flag.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
