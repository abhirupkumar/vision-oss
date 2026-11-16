import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FeatureCard } from '../BetterStackSection';
import { CreditCard, Wallet, TrendingUp, Check } from 'lucide-react';

// ─── 1. PAYMENTS AND SUBSCRIPTION COMPLETE CARD ──────────────────────────────
export function PaymentsSubscriptionsCard() {
  const [mrr, setMrr] = useState(48204);
  const [transactions] = useState([
    { id: 1, plan: 'Pro Annual ($99/mo)', customer: 'sarah@hyper.io', amount: '+$1,188', time: 'Just now' },
    { id: 2, plan: 'Enterprise Monthly', customer: 'alex@acme.com', amount: '+$840', time: '2m ago' },
    { id: 3, plan: 'Starter → Pro Upgrade', customer: 'dev@novastack.ai', amount: '+$70', time: '5m ago' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMrr((prev) => prev + Math.floor(Math.random() * 50) + 10);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <FeatureCard
      title="Payments & Subscriptions"
      description="Track real-time Stripe and Paddle transactions, subscription renewals, plan upgrades, and MRR growth."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* MRR Top Scorecard */}
        <div className="flex items-center justify-between bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-4 rounded-2xl shadow-xs">
          <div>
            <div className="text-[10px] text-t-muted uppercase font-sans font-semibold">Monthly Recurring Revenue</div>
            <motion.div
              key={mrr}
              className="text-3xl font-bold text-t-primary my-1"
            >
              ${mrr.toLocaleString()}
            </motion.div>
            <div className="text-[11px] text-emerald-700 dark:text-[#00E599] font-semibold flex items-center gap-1 font-sans">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+16.4% Net New ARR MTD</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] font-semibold block">
              Churn: 1.2%
            </span>
            <span className="text-[10px] text-t-muted block font-mono">NRR: 114%</span>
          </div>
        </div>

        {/* Live Transaction Stream */}
        <div className="space-y-2 my-2">
          <div className="text-[10px] text-t-muted uppercase font-sans font-semibold pb-1 flex justify-between">
            <span>Stripe & Paddle Webhooks</span>
            <span className="text-emerald-700 dark:text-[#00E599] font-semibold">Live Sync</span>
          </div>

          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between text-xs shadow-xs"
            >
              <div className="overflow-hidden mr-2">
                <div className="flex items-center gap-2 text-t-primary font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00E599] shrink-0" />
                  <span className="truncate">{tx.plan}</span>
                </div>
                <div className="text-[10px] text-t-muted truncate">{tx.customer}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-emerald-700 dark:text-[#00E599] font-bold text-xs">{tx.amount}</div>
                <div className="text-[10px] text-t-muted">{tx.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer sync indicator */}
        <div className="flex items-center justify-between text-[11px] text-t-secondary pt-1 font-sans">
          <span>Gateway: <strong className="text-t-primary font-mono">Stripe & Paddle auto-sync</strong></span>
          <span className="text-emerald-700 dark:text-[#00E599] font-semibold font-mono">Connected</span>
        </div>
      </div>
    </FeatureCard>
  );
}

// ─── 2. PER USER REVENUE CARD ────────────────────────────────────────────────
export function PerUserRevenueCard() {
  const users = [
    { email: 'alex@acme.com', plan: 'Enterprise', mrr: '$840.00', ltv: '$9,240', margin: '92%' },
    { email: 'sarah@hyper.io', plan: 'Pro', mrr: '$720.00', ltv: '$4,320', margin: '89%' },
    { email: 'dev@novastack.ai', plan: 'Pro', mrr: '$610.00', ltv: '$3,660', margin: '91%' },
    { email: 'bob@zenith.co', plan: 'Starter', mrr: '$199.00', ltv: '$1,194', margin: '84%' },
  ];

  return (
    <FeatureCard
      title="Per user revenue"
      description="Link financial outcomes to user profiles. Identify your highest-paying accounts and monitor individual expansion revenue."
    >
      <div className="w-full h-full p-6 flex flex-col justify-between font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-t-primary flex items-center gap-1.5 font-sans">
            <Wallet className="w-4 h-4 text-purple-600 dark:text-[#A78BFA]" />
            Customer Revenue Attribution
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-[#A78BFA] font-semibold">
            ARPU: $148.50
          </span>
        </div>

        {/* Customer Ledger Table */}
        <div className="space-y-1.5 my-2">
          <div className="grid grid-cols-4 text-[10px] text-t-muted uppercase pb-1 font-sans font-semibold">
            <span className="col-span-2">Customer Account</span>
            <span className="text-right">MRR</span>
            <span className="text-right">LTV</span>
          </div>

          {users.map((u) => (
            <div
              key={u.email}
              className="grid grid-cols-4 items-center text-xs p-3 rounded-xl bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] shadow-xs"
            >
              <div className="col-span-2 overflow-hidden pr-1">
                <div className="text-t-primary font-medium text-[11px] truncate">{u.email}</div>
                <div className="text-[10px] text-emerald-700 dark:text-[#00E599] font-semibold">{u.plan}</div>
              </div>
              <span className="text-right text-t-primary font-bold text-xs">{u.mrr}</span>
              <span className="text-right text-t-secondary text-xs">{u.ltv}</span>
            </div>
          ))}
        </div>

        {/* LTV:CAC Ratio summary */}
        <div className="bg-white dark:bg-[#0B1017]/80 border border-slate-200/80 dark:border-white/[0.05] p-3 rounded-xl flex items-center justify-between text-[11px] font-sans shadow-xs">
          <span className="text-t-secondary">
            Average LTV to CAC Ratio: <strong className="text-emerald-700 dark:text-[#00E599] font-mono font-bold">4.8×</strong>
          </span>
          <span className="text-t-muted text-[10px] font-mono">Payback: 34d</span>
        </div>
      </div>
    </FeatureCard>
  );
}
