import React from 'react';
import { ArrowLeft, ShieldAlert, FileText, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { DASHBOARD_URL } from '../lib/config';

export default function TermsAndConditions() {
  return (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 max-w-[1000px] mx-auto text-t-primary">
      {/* Top Breadcrumb / Back button */}
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] text-xs font-semibold mb-4">
          <FileText className="w-3.5 h-3.5" />
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-t-primary mb-4">
          Terms & Conditions
        </h1>
        <p className="text-sm sm:text-base text-t-secondary">
          Last updated: October 22, 2026 · Effective immediately for all users and accounts.
        </p>
      </div>

      {/* Notice Callout: STRICT NO REFUNDS */}
      <div className="mb-12 p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200 mb-1">
              Important Notice Regarding Billing & Refunds
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
              Vision is a digital infrastructure service. By subscribing to any paid plan or paid service,
              you acknowledge and expressly agree that <strong>all fees are strictly non-refundable</strong>.
              We do not provide prorated refunds, partial-month credits, or returns of any kind once a
              billing cycle has begun. Please evaluate Vision using our free trial or free tier before purchasing.
              See <a href="/refunds" className="underline font-semibold hover:text-amber-950 dark:hover:text-white">Section 6 and our Refund Policy</a> for full details.
            </p>
          </div>
        </div>
      </div>

      {/* Body content */}
      <div className="space-y-10 sm:space-y-12 text-sm sm:text-base text-t-secondary leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            1. Acceptance of Terms
          </h2>
          <p>
            These Terms & Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you
            (&quot;Customer&quot;, &quot;you&quot;, or &quot;your&quot;) and Vision (&quot;Vision&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
            governing your access to and use of our web analytics platform, LLM observability tooling,
            session recording software, APIs, SDKs, and related services (collectively, the &quot;Service&quot;).
          </p>
          <p>
            By creating an account, embedding our tracking script, accessing our dashboard, or purchasing a subscription,
            you represent that you have read, understood, and agree to be bound by these Terms. If you are entering
            into these Terms on behalf of an organization, you represent that you have the authority to bind that entity.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            2. Description of Service
          </h2>
          <p>
            Vision provides modern, privacy-focused product analytics, LLM observability, session recording,
            error monitoring, and revenue unit-economics intelligence. You may integrate our client tracking
            script, server SDKs, and APIs into your digital properties to collect telemetry, analyze visitor sessions,
            and monitor AI workloads.
          </p>
          <p>
            We reserve the right to modify, enhance, or discontinue features of the Service at any time,
            provided that material changes will be communicated via the dashboard or email.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            3. Account Registration & Security
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              You must provide accurate, complete registration details and keep your contact and billing information up to date.
            </li>
            <li>
              You are solely responsible for safeguarding your login credentials, project tokens, and API keys. Any action taken under your account credentials is treated as authorized by you.
            </li>
            <li>
              You must immediately notify Vision of any unauthorized access, breach of security, or token compromise.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            4. Data Privacy, Compliance & Customer Responsibilities
          </h2>
          <p>
            Vision is engineered with privacy-first principles. However, as the data controller of your website or application,
            you are responsible for complying with all applicable global privacy laws (including GDPR, CCPA/CPRA, and PECR).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Notice and Consent:</strong> You must maintain a legally compliant privacy policy disclosing your use of analytics and tracking tools, including Vision.
            </li>
            <li>
              <strong>Sensitive Data & PII:</strong> You agree not to send sensitive personal data (such as passwords, credit card numbers, health data, or government IDs) to Vision. For session recording, you must utilize masking attributes to obscure confidential fields.
            </li>
            <li>
              <strong>Data Ownership:</strong> You retain all ownership, rights, and title to your raw telemetry data. We do not sell your customer data or monetize your metrics.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            5. Subscription Plans & Billing
          </h2>
          <p>
            Paid subscriptions provide access to enhanced event quotas, session recording storage, LLM trace limits,
            and advanced features according to our published rate card.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Recurring Charges:</strong> Paid plans renew automatically on a monthly or annual billing cycle unless canceled before the renewal date.
            </li>
            <li>
              <strong>Merchant of Record & Payments:</strong> Billing is securely handled by our authorized payment processors and Merchant of Record (including Dodo Payments and Stripe). By subscribing, you authorize our payment processor to charge your specified payment method.
            </li>
            <li>
              <strong>Failed Payments:</strong> If a recurring payment fails, we provide a grace period. Continued payment failure may result in account restriction, ingestion pausing, or subscription termination.
            </li>
            <li>
              <strong>Taxes:</strong> All fees are exclusive of applicable value-added tax (VAT), sales tax, or other governmental assessments, which will be billed as required by law.
            </li>
          </ul>
        </section>

        {/* Section 6 - THE NO REFUND CLAUSE */}
        <section className="space-y-3 p-6 sm:p-8 rounded-2xl bg-bg-card border border-bdr shadow-xs">
          <h2 className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
            <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-[#00E599]" />
            6. Strict No-Refund Policy
          </h2>
          <div className="space-y-3 text-t-secondary">
            <p className="font-semibold text-t-primary">
              PLEASE READ THIS SECTION CAREFULLY. ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE.
            </p>
            <p>
              Due to the immediate provisioning of dedicated cloud compute, real-time edge streaming, high-performance database ingestion (Tinybird/ClickHouse), and instantaneous software feature access:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No Cash Refunds:</strong> We do not issue cash refunds, charge credits, or bank reversals for any subscription charges, renewal fees, or usage fees already processed.
              </li>
              <li>
                <strong>No Prorated Credits:</strong> If you choose to cancel your subscription or downgrade your plan before the end of your billing cycle, your service will remain accessible until the end of that paid period. We do not provide prorated credits or refunds for unused days or unused event quotas.
              </li>
              <li>
                <strong>Free Trial as Evaluation:</strong> We provide a free trial and a permanent free tier so you can thoroughly test Vision&apos;s features, tracker, and dashboards prior to incurring any financial commitment.
              </li>
              <li>
                <strong>Cancellations:</strong> You can cancel your subscription at any time with one click from your Dashboard settings (<code>Settings → Billing</code>). Cancellation takes effect at the conclusion of your active billing period, ensuring you are not charged again.
              </li>
              <li>
                <strong>Chargebacks & Disputes:</strong> Initiating an unauthorized chargeback or payment dispute with your bank without first contacting Vision support is a violation of these Terms and will result in immediate suspension or termination of your account and related project data.
              </li>
            </ul>
            <p>
              For our standalone, comprehensive refund terms, please visit our dedicated{' '}
              <a href="/refunds" className="text-primary font-semibold hover:underline">
                Refund & Cancellation Policy
              </a>.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            7. Acceptable Use Policy
          </h2>
          <p>
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Track websites or applications engaged in unlawful activities, malware distribution, phishing, or hate speech.</li>
            <li>Attempt to probe, scan, or breach the security of our API, Cloudflare Workers, or database infrastructure.</li>
            <li>Reverse-engineer, decompile, or copy the proprietary tracking or aggregation engines of Vision.</li>
            <li>Generate abusive automated traffic or intentional DDoS volume targeting our collection endpoints.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            8. Limitation of Liability & Warranty Disclaimer
          </h2>
          <p>
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS, STATUTORY, OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE BY LAW, VISION DISCLAIMS ALL
            WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            UNDER NO CIRCUMSTANCES SHALL VISION, ITS FOUNDERS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES (INCLUDING LOSS OF PROFITS, DATA LOSS, OR BUSINESS
            INTERRUPTION), EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL VISION&apos;S TOTAL AGGREGATE
            LIABILITY EXCEED THE TOTAL FEES ACTUALLY PAID BY YOU TO VISION IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            9. Termination
          </h2>
          <p>
            You may terminate your account at any time by navigating to your account settings in the dashboard.
            Vision reserves the right to suspend or terminate your access immediately if you breach these Terms,
            engage in fraudulent payment activity, or exceed acceptable technical parameters.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3 pb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-t-primary tracking-tight">
            10. Contact & Questions
          </h2>
          <p>
            If you have questions regarding these Terms & Conditions, please contact our team:
          </p>
          <div className="p-4 rounded-xl bg-bg-card border border-bdr inline-block">
            <p className="font-semibold text-t-primary">Vision Legal & Compliance</p>
            <p className="text-t-secondary text-sm">
              Email: <a href="mailto:support@vision.dev" className="text-primary hover:underline">support@vision.dev</a>
            </p>
            <p className="text-t-secondary text-sm">
              Dashboard: <a href={DASHBOARD_URL} className="text-primary hover:underline">{DASHBOARD_URL}</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
