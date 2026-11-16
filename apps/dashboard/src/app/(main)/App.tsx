'use client';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MobileNav } from '@/app/(main)/MobileNav';
import { SideNav } from '@/app/(main)/SideNav';
import { useLoginQuery } from '@/components/hooks/queries/useLoginQuery';
import { useConfig } from '@/components/hooks/useConfig';
import { useNavigation } from '@/components/hooks/useNavigation';
import { useUniversalBillingQuery } from '@/components/hooks/queries/useBillingQuery';
import { BillingLockoutModal } from '@/components/billing/BillingLockoutModal';
import { BillingAlertIcon } from '@/components/billing/BillingAlertIcon';
import { LAST_ORGANIZATION_CONFIG } from '@/lib/constants';
import { removeItem, setItem } from '@/lib/storage';
import { HAS_BILLING } from '@/lib/features';
import { UpdateNotice } from './UpdateNotice';

export function App({ children }) {
  const router = useRouter();
  const { pathname, organizationId, projectId } = useNavigation();
  const { user, isLoading, error } = useLoginQuery();
  const config = useConfig();

  const { data: billingData } = useUniversalBillingQuery({
    refetchInterval: 30000,
  });

  const sub = billingData?.subscription;
  const hasNoPlan = !sub || sub.status === 'inactive';
  const isExpired = Boolean(
    sub?.status === 'expired' ||
      (sub?.currentPeriodEnd &&
        new Date(sub.currentPeriodEnd).getTime() < Date.now() &&
        sub.status !== 'active')
  );
  const isCancelled = sub?.status === 'cancelled';
  const isPaymentFailed =
    sub?.status === 'unpaid' ||
    sub?.status === 'past_due' ||
    sub?.status === 'failed';
  const isCapReached = Boolean(sub?.isLocked && sub?.lockedReason === 'spending_cap_reached');
  const isExplicitLocked = Boolean(sub?.isLocked);

  const rawIsLocked = Boolean(hasNoPlan || isExpired || isCancelled || isPaymentFailed || isExplicitLocked);
  const isLocked = HAS_BILLING ? rawIsLocked : false;
  const lockedReason = isCapReached
    ? 'spending_cap_reached'
    : sub?.lockedReason || (hasNoPlan ? 'no_plan' : 'payment_required');
  useEffect(() => {
    if (
      user &&
      user.organizations &&
      user.organizations.length === 0 &&
      pathname !== '/onboarding'
    ) {
      router.push('/onboarding');
    }
  }, [user, pathname, router]);

  if (isLoading || !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
        <h1 className="text-2xl font-bold mb-2">Service Unavailable</h1>
        <p className="text-zinc-500 mb-4 max-w-md">
          We couldn't reach the server or verify your account. Please try again later.
        </p>
        <button
          onClick={() => window.location.href = '/sign-in'}
          className="bg-zinc-950 text-white px-4 py-2 rounded hover:bg-zinc-800"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  if (!user || !config) {
    return null;
  }

  // Enforce mandatory onboarding: if user belongs to 0 organizations (orgs), redirect
  if (user.organizations && user.organizations.length === 0 && pathname !== '/onboarding') {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface dark:bg-background">
      {/* Sidebar — desktop */}
      {!projectId && (
        <aside className="hidden lg:flex z-10 relative">
          <SideNav />
        </aside>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <MobileNav />
          <BillingAlertIcon variant="badge" />
        </div>

        {/* Global Alert Notification Banner across entire dashboard when locked / no active plan */}
        {isLocked && !pathname.includes('/settings/billing') && (
          <div className="flex items-center justify-between border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-400 shrink-0 z-30">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-rose-500 animate-pulse" />
              <span>
                {hasNoPlan
                  ? 'No active subscription plan. Event tracking and ingestion APIs (/send, /record, /errors) are suspended.'
                  : isExpired
                  ? 'Your subscription plan has expired. Tracking and reporting are paused until payment is settled.'
                  : isCancelled
                  ? 'Your subscription is cancelled. Data ingestion is suspended.'
                  : isCapReached
                  ? 'Monthly spending cap reached. Ingestion is paused to prevent overages.'
                  : 'Account locked due to unpaid bill. Data ingestion is suspended.'}
              </span>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-1 font-semibold text-rose-300 underline hover:text-rose-100 shrink-0 ml-4"
            >
              Review Billing &rarr;
            </Link>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">{children}</main>
      </div>

      {/* Floating Desktop Billing Alert Badge in the top right across all pages */}
      {HAS_BILLING && (
        <div className="fixed top-3.5 right-6 z-40 hidden lg:flex items-center">
          <BillingAlertIcon variant="badge" />
        </div>
      )}

      <UpdateNotice user={user} config={config} />
      {HAS_BILLING && <BillingLockoutModal isLocked={isLocked} lockedReason={lockedReason} />}
      {process.env.NODE_ENV === 'production' && !pathname.includes('/share/') && (
        <Script src={`${process.env.basePath || ''}/telemetry.js`} />
      )}
    </div>
  );
}
