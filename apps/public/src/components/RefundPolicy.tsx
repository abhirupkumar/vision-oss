import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertOctagon, RefreshCw, HelpCircle, Ban, Clock } from 'lucide-react';
import { DASHBOARD_URL } from '../lib/config';

export default function RefundPolicy() {
  return (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 max-w-[1000px] mx-auto text-t-primary">
      {/* Top Breadcrumb */}
      <div className="mb-8 sm:mb-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-t-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </a>
      </div>

      {/* Header */}
      <div className="mb-10 sm:mb-14 pb-8 border-b border-bdr">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 text-xs font-semibold mb-4">
          <Ban className="w-3.5 h-3.5" />
          Policy Document
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-t-primary mb-4">
          Cancellation & Refund Policy
        </h1>
        <p className="text-sm sm:text-base text-t-secondary">
          Last updated: October 22, 2026 · Standard policy for all Vision plans and subscriptions.
        </p>
      </div>

      {/* Big Hero Banner: Strict No Refunds */}
      <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-bg-card border-2 border-rose-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-t-primary mb-2">
              Strict No-Refund Policy
            </h2>
            <p className="text-sm sm:text-base text-t-secondary leading-relaxed">
              Vision operates under a <strong>strict no-refund policy</strong>. All subscription payments,
              renewal fees, and usage charges are final, non-refundable, and non-creditable.
              We do not issue partial, prorated, or retrospective refunds under any standard circumstances.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-10 sm:space-y-12 text-sm sm:text-base text-t-secondary leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            1. Why We Do Not Offer Refunds
          </h2>
          <p>
            Vision is a high-throughput, real-time data infrastructure service. Unlike physical goods or static software licenses:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Immediate Infrastructure Allocation:</strong> When you connect your project or subscribe, our edge cluster (Cloudflare Workers, Kafka buffers, and Tinybird/ClickHouse databases) immediately provisions dedicated ingestion pipelines, storage quotas, and real-time query engines.
            </li>
            <li>
              <strong>Incurred Operational Costs:</strong> Ingesting, parsing, deduplicating, and indexing millions of events, LLM traces, and session replay chunks consumes irreversible cloud compute and storage resources from the first second of usage.
            </li>
            <li>
              <strong>Instant Digital Access:</strong> Premium platform features, AI anomaly detectors, and unlimited dashboard exploration are made available in full immediately upon checkout.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            2. Try Before You Buy: 7-Day Free Trial & Free Tier
          </h2>
          <p>
            To ensure complete satisfaction before committing to a paid plan, Vision provides:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-bg-card border border-bdr">
              <div className="flex items-center gap-2 font-bold text-t-primary text-sm mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                7-Day Free Trial
              </div>
              <p className="text-xs sm:text-sm text-t-secondary">
                Full access to premium analytics, LLM observability, and recording tools without upfront risk.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-card border border-bdr">
              <div className="flex items-center gap-2 font-bold text-t-primary text-sm mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Permanent Free Tier
              </div>
              <p className="text-xs sm:text-sm text-t-secondary">
                Generous monthly event allotment to test the tracker and verify metrics on your live site.
              </p>
            </div>
          </div>
          <p className="pt-2 text-xs sm:text-sm">
            We strongly encourage all prospective customers to utilize the free trial or free tier to confirm that Vision satisfies all business, technical, and analytical requirements prior to upgrading.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            3. How to Cancel Your Subscription Anytime
          </h2>
          <p>
            You have complete autonomy over your subscription. You can cancel at any time with one click directly from your dashboard:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Log into your Vision Dashboard at <a href={DASHBOARD_URL} className="text-primary hover:underline">{DASHBOARD_URL}</a>.</li>
            <li>Navigate to <strong>Settings → Billing</strong>.</li>
            <li>Click <strong>Manage Subscription</strong> or <strong>Cancel Plan</strong>.</li>
            <li>Confirm your cancellation.</li>
          </ol>
          <div className="p-4 rounded-xl bg-bg-card border border-bdr flex items-start gap-3 mt-4">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-[#00E599] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm">
              <strong>Retain Access Until Period Ends:</strong> When you cancel, your account will remain on the active paid plan until the final day of your current billing period. After that date, your card will never be charged again, and your account will automatically convert to the free tier.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            4. Recurring Subscriptions & Accidental Renewals
          </h2>
          <p>
            All subscriptions renew automatically on a monthly or annual basis to prevent service interruption or event loss.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Customers receive invoices and receipts by email upon successful payment.
            </li>
            <li>
              It is the customer&apos;s responsibility to cancel their subscription prior to the scheduled renewal date if they do not wish to continue.
            </li>
            <li>
              Requests for refunds due to forgetting to cancel, lack of platform usage, team departures, or accidental renewals will be declined in accordance with this policy.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            5. Payment Disputes & Chargebacks
          </h2>
          <p>
            We take pride in transparent customer service and fair pricing. If you have an inquiry regarding a charge on your card, please contact our support team at <a href="mailto:support@vision.dev" className="text-primary hover:underline font-semibold">support@vision.dev</a> before contacting your financial institution.
          </p>
          <p>
            Initiating an unauthorized chargeback or payment reversal without prior communication constitutes a breach of our Terms & Conditions. In the event of a chargeback, Vision reserves the right to immediately suspend your organization, lock all active projects, and permanently block the associated domains.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            6. Rare Technical Exceptions
          </h2>
          <p>
            The only circumstances under which an adjustment or refund may be considered are:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Duplicate Billing:</strong> If our payment processor (Dodo Payments / Stripe) accidentally charges your credit card twice for the exact same billing period due to a verified gateway transmission error, we will promptly refund the duplicate transaction.
            </li>
            <li>
              <strong>Statutory Legal Rights:</strong> For customers residing in jurisdictions where statutory consumer rights cannot be waived by contract, nothing in this policy limits your rights under mandatory applicable local law.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 pb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            7. Billing Support Inquiries
          </h2>
          <p>
            For questions about an existing invoice, updating your payment details, or managing your subscription, our billing team is here to assist:
          </p>
          <div className="p-4 rounded-xl bg-bg-card border border-bdr inline-block">
            <p className="font-semibold text-t-primary">Vision Billing Support</p>
            <p className="text-t-secondary text-sm">
              Email: <a href="mailto:support@vision.dev" className="text-primary hover:underline">support@vision.dev</a>
            </p>
            <p className="text-t-secondary text-sm">
              Billing Portal: <a href={`${DASHBOARD_URL}/settings/billing`} className="text-primary hover:underline">{DASHBOARD_URL}/settings/billing</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
