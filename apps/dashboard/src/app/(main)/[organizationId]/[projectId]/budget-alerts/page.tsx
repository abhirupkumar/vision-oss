'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ShieldAlert, Check, Plus, AlertTriangle, Coins } from 'lucide-react';

export default function BudgetAlertsPage() {
  const [saved, setSaved] = useState(false);
  const [projectBudget, setProjectBudget] = useState('500');
  const [userLimit, setUserLimit] = useState('25');
  const [alertThreshold, setAlertThreshold] = useState('80');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title="Budget Guardrails"
        description="Configure automated cost caps, per-user model spend limits, and margin protection alerts."
        icon={<Bell className="h-5 w-5 text-primary" />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Monthly Project Budget</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Alert when total model inference spend approaches limit
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">$</span>
              <input
                type="number"
                value={projectBudget}
                onChange={(e) => setProjectBudget(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">USD / mo</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Notify at {alertThreshold}% spent (${(Number(projectBudget) * Number(alertThreshold) / 100).toFixed(0)})</span>
              <Badge variant="outline" className="text-xs font-normal">Slack &amp; Discord</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Per-User Cost Ceiling</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Flag or throttle accounts exceeding individual compute threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">$</span>
              <input
                type="number"
                value={userLimit}
                onChange={(e) => setUserLimit(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">USD / user</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Prevents unprofitable negative-margin usage</span>
              <Badge variant="outline" className="text-xs font-normal">Auto-flag</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Guardrail Rules</CardTitle>
          <CardDescription>Rules evaluated continuously as streaming tokens are ingested</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-sm font-medium">Cost Anomaly Detection (2σ Spike)</div>
                  <div className="text-xs text-muted-foreground">Alerts when hourly inference exceeds 200% of rolling 7-day average</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Margin Compression Alert</div>
                  <div className="text-xs text-muted-foreground">Alerts if blended gross margin dips below 70% threshold</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              {saved ? <Check className="h-4 w-4 text-emerald-300" /> : <Plus className="h-4 w-4" />}
              {saved ? 'Guardrails Saved' : 'Save Guardrails'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
