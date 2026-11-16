'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Video,
  Activity,
  Cpu,
  Split,
  Terminal,
  Sliders,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useNavigation, useApi } from '@/components/hooks';
import { useBillingQuery } from '@/components/hooks/queries/useBillingQuery';

export function BillingSettingsPage() {
  const { organizationId } = useNavigation();
  const { post, patch } = useApi();
  const { data, isLoading, refetch } = useBillingQuery(organizationId);

  const [savingCap, setSavingCap] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [customCap, setCustomCap] = useState<number | null>(null);
  const [pauseToggle, setPauseToggle] = useState<boolean | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const sub = data?.subscription;
  const usage = data?.usage;
  const counts = usage?.counts || {
    eventsCount: 0,
    replaysCount: 0,
    errorsCount: 0,
    llmCallsCount: 0,
    abTestsCount: 0,
  };
  const cost = usage?.cost || {
    eventsCost: 0,
    replaysCost: 0,
    errorsCost: 0,
    llmCost: 0,
    abTestsCost: 0,
    mcpCost: 0,
    totalUsageSpend: 0,
    includedCredit: 39,
    creditUsed: 0,
    billableOverage: 0,
    percentCreditUsed: 0,
  };

  const spendingCap = customCap !== null ? customCap : Number(sub?.spendingCap || 150);
  const pauseOnCap = pauseToggle !== null ? pauseToggle : Boolean(sub?.pauseOnCap ?? true);
  const isLocked = Boolean(sub?.isLocked || sub?.status === 'unpaid');

  const handleCheckout = async () => {
    try {
      setLoadingCheckout(true);
      const res = await post(`/organizations/${organizationId}/billing/checkout`, {});
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start Dodo Payments checkout session.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handlePortal = async () => {
    try {
      setLoadingPortal(true);
      const res = await post(`/organizations/${organizationId}/billing/portal`, {});
      if (res.portalUrl) {
        window.location.href = res.portalUrl;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open Dodo Payments customer portal.');
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSaveCap = async () => {
    try {
      setSavingCap(true);
      setSaveMessage(null);
      await patch(`/organizations/${organizationId}/billing`, {
        spendingCap,
        pauseOnCap,
      });
      setSaveMessage('Spending cap settings updated successfully.');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update spending cap.');
    } finally {
      setSavingCap(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  const periodStart = sub?.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : 'N/A';
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A';

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Universal Usage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Universal $39 Base Plan with $39 included universal usage credit. Real-time bracket rate cards and MoR processing powered by Dodo Payments.
        </p>
      </div>

      {/* Hard Lockout Warning Banner */}
      {isLocked && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 text-rose-300 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
            <Lock size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-rose-200">Account Locked & Ingestion Halted</h3>
            <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
              {sub?.lockedReason === 'spending_cap_reached'
                ? 'Your monthly spending cap has been reached. Ingestion is paused. Raise your spending cap below to immediately resume tracking.'
                : 'Your billing cycle ended and your monthly invoice has not been settled. Live event collection and dashboard queries are paused until payment is completed.'}
            </p>
            <div className="mt-3 flex gap-3">
              {sub?.dodoCustomerId ? (
                <button
                  onClick={handlePortal}
                  disabled={loadingPortal}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <CreditCard size={14} />
                  <span>Update Card in Dodo Portal</span>
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <CreditCard size={14} />
                  <span>Pay Now with Dodo Payments</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Universal Base Plan Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Current Plan</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  sub?.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {sub?.status === 'active' ? 'Active' : sub?.status || 'Inactive'}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground mt-1">
              $39 <span className="text-sm font-normal text-muted-foreground">/ month</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Billing Period: <span className="text-foreground font-medium">{periodStart}</span> to{' '}
              <span className="text-foreground font-medium">{periodEnd}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {sub?.status === 'active' && sub?.dodoCustomerId ? (
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors"
              >
                <ExternalLink size={14} />
                <span>{loadingPortal ? 'Opening Portal...' : 'Dodo Customer Portal'}</span>
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loadingCheckout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-md shadow-primary/20"
              >
                <CreditCard size={14} />
                <span>{loadingCheckout ? 'Redirecting...' : 'Subscribe via Dodo Payments ($39/mo)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Universal Credit Drawdown Progress Meter */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary" />
              <span>Universal Included Credit Drawdown</span>
            </span>
            <span className="text-muted-foreground">
              ${cost.creditUsed.toFixed(2)} of ${cost.includedCredit.toFixed(2)} utilized ({cost.percentCreditUsed.toFixed(0)}%)
            </span>
          </div>

          <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden p-0.5 border border-border/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cost.percentCreditUsed >= 100
                  ? 'bg-rose-500'
                  : cost.percentCreditUsed >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(cost.percentCreditUsed, 100)}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Universal Spend: </span>
              <span className="font-semibold text-foreground">${cost.totalUsageSpend.toFixed(2)}</span>
            </div>
            {cost.billableOverage > 0 ? (
              <div className="text-rose-400 font-medium">
                Billable Overage: <span className="font-bold">${cost.billableOverage.toFixed(2)}</span> (settled at cycle end)
              </div>
            ) : (
              <div className="text-emerald-400 font-medium">
                Remaining Credit: <span className="font-bold">${Math.max(0, cost.includedCredit - cost.totalUsageSpend).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itemized 6-Product Usage Rate Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Product Usage & Rate Cards</h2>
          <button
            onClick={() => refetch()}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} />
            <span>Refresh usage</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Events */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Activity size={15} className="text-blue-400" />
                  Web Analytics Events
                </span>
                <span className="text-sm font-bold text-foreground">${cost.eventsCost.toFixed(2)}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {counts.eventsCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">events recorded this period</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">Bracket Rates:</div>
              <div>1st 250k: $0.40/k | 250k–2M: $0.25/k</div>
              <div>2M–10M: $0.15/k | 10M+: $0.08/k</div>
            </div>
          </div>

          {/* 2. Session Replays */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Video size={15} className="text-purple-400" />
                  Session Replays
                </span>
                <span className="text-sm font-bold text-foreground">${cost.replaysCost.toFixed(2)}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {counts.replaysCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">recordings captured this period</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">Bracket Rates:</div>
              <div>1st 5k: $3.50/k | 5k–25k: $2.50/k</div>
              <div>25k+: $1.50/k</div>
            </div>
          </div>

          {/* 3. Error Tracking */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-rose-400" />
                  Error Tracking
                </span>
                <span className="text-sm font-bold text-foreground">${cost.errorsCost.toFixed(2)}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {counts.errorsCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">error spans collected this period</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">Bracket Rates:</div>
              <div>1st 50k: $0.35/k | 50k–250k: $0.25/k</div>
              <div>250k–1M: $0.18/k | 1M+: $0.10/k</div>
            </div>
          </div>

          {/* 4. LLM Observability */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu size={15} className="text-emerald-400" />
                  LLM Observability
                </span>
                <span className="text-sm font-bold text-foreground">${cost.llmCost.toFixed(2)}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {counts.llmCallsCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">LLM generation calls & traces</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">Bracket Rates:</div>
              <div>1st 50k: $1.20/k | 50k–500k: $0.80/k</div>
              <div>500k+: $0.40/k</div>
            </div>
          </div>

          {/* 5. A/B Testing */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Split size={15} className="text-amber-400" />
                  A/B Testing & Experiments
                </span>
                <span className="text-sm font-bold text-foreground">${cost.abTestsCost.toFixed(2)}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {counts.abTestsCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">sessions evaluated in experiments</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">Flat Rate:</div>
              <div>$1.00 per 10,000 evaluated sessions</div>
              <div>Includes conversion tracking & metrics</div>
            </div>
          </div>

          {/* 6. MCP Server */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between bg-primary/[0.02]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Terminal size={15} className="text-primary" />
                  MCP Server & AI Agents
                </span>
                <span className="text-sm font-bold text-emerald-400">$0.00</span>
              </div>
              <div className="text-2xl font-extrabold text-primary tracking-tight">
                FREE
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Model Context Protocol integrations</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">Included:</div>
              <div>100% Free & Unlimited on Base Plan</div>
              <div>Cursor, Claude Desktop & Windsurf integrations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Spending Cap & Overuse Protection */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sliders size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">Spending Cap & Overuse Protection</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Set a maximum budget ceiling for total monthly usage spend. When the cap is reached, tracking can be automatically paused to eliminate unexpected charges.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">
              Monthly Spending Cap ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-muted-foreground text-sm font-semibold">$</span>
              <input
                type="number"
                min={39}
                step={5}
                value={spendingCap}
                onChange={e => setCustomCap(Math.max(39, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Must be at least $39.00 (base plan amount). Current spend: ${cost.totalUsageSpend.toFixed(2)}.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">
              Cap Enforcement Behavior
            </label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-accent/30 transition-colors">
              <input
                type="checkbox"
                checked={pauseOnCap}
                onChange={e => setPauseToggle(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Pause tracking on cap</span>
                <span className="text-muted-foreground block mt-0.5">
                  Automatically halt event collection when monthly spend reaches the cap. Prevents additional overages.
                </span>
              </div>
            </label>
          </div>
        </div>

        {saveMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveCap}
            disabled={savingCap}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-md shadow-primary/20"
          >
            {savingCap ? 'Saving...' : 'Save Cap Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
