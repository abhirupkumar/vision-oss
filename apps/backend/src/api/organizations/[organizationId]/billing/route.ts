import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getOrganizationSubscription,
  upsertOrganizationSubscription,
  updateSpendingCap,
  setOrganizationLock,
  getOrganizationProjectIds,
  getOrganizationPeriodUsage,
  calculateItemizedUsageCost,
} from '@vision/db';
import {
  canViewOrganization,
  canUpdateOrganization,
} from '../../../../lib/permissions/organization.js';
import { unauthorized, notFound, badRequest } from '../../../../lib/response.js';
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/dodo.js';

const app = new Hono<{ Variables: { auth: any } }>();

function getMonthBoundaries(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

app.get('/', async (c) => {
  const organizationId = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canViewOrganization(auth, organizationId))) {
    return unauthorized();
  }

  let sub = await getOrganizationSubscription(organizationId);
  const defaultDates = getMonthBoundaries();

  if (!sub) {
    // Initialize default subscription representation for the organization
    sub = await upsertOrganizationSubscription({
      organizationId,
      status: 'inactive',
      planTier: 'base_39',
      baseAmount: '39.00',
      includedCredit: '39.00',
      spendingCap: '150.00',
      pauseOnCap: true,
      currentPeriodStart: defaultDates.start,
      currentPeriodEnd: defaultDates.end,
    });
  }

  const periodStart = sub.currentPeriodStart || defaultDates.start;
  const periodEnd = sub.currentPeriodEnd || defaultDates.end;

  const projectIds = await getOrganizationProjectIds(organizationId);
  const counts = await getOrganizationPeriodUsage(projectIds, periodStart, periodEnd);
  const cost = calculateItemizedUsageCost(counts, Number(sub.includedCredit || 39.0));

  return c.json({
    subscription: {
      ...sub,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    usage: {
      counts,
      cost,
    },
  });
});

const checkoutSchema = z.object({
  returnUrl: z.string().url().optional(),
});

app.post('/checkout', zValidator('json', checkoutSchema), async (c) => {
  const organizationId = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canUpdateOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const { returnUrl } = c.req.valid('json');
  const user = auth.user;

  try {
    const finalReturnUrl = returnUrl || `${c.req.header('referer') || 'http://localhost:3000'}/settings/billing?success=true`;
    const result = await createCheckoutSession({
      organizationId,
      email: user.email,
      name: user.name || user.firstName,
      returnUrl: finalReturnUrl,
    });

    return c.json(result);
  } catch (err: any) {
    console.error('[Billing Checkout] Error creating session:', err);
    return c.json({ error: err.message || 'Failed to create checkout session' }, 500);
  }
});

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

app.post('/portal', zValidator('json', portalSchema), async (c) => {
  const organizationId = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canUpdateOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const sub = await getOrganizationSubscription(organizationId);
  if (!sub?.dodoCustomerId) {
    return c.json({ error: 'No active billing customer found for this organization.' }, 400);
  }

  const { returnUrl } = c.req.valid('json');
  try {
    const finalReturnUrl = returnUrl || `${c.req.header('referer') || 'http://localhost:3000'}/settings/billing`;
    const result = await createCustomerPortalSession(sub.dodoCustomerId, finalReturnUrl);
    return c.json(result);
  } catch (err: any) {
    console.error('[Billing Portal] Error creating session:', err);
    return c.json({ error: err.message || 'Failed to create customer portal session' }, 500);
  }
});

const patchSchema = z.object({
  spendingCap: z.number().min(39).max(50000).optional(),
  pauseOnCap: z.boolean().optional(),
});

app.patch('/', zValidator('json', patchSchema), async (c) => {
  const organizationId = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canUpdateOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const { spendingCap, pauseOnCap } = c.req.valid('json');
  const existingSub = await getOrganizationSubscription(organizationId);
  const currentCap = spendingCap ?? (existingSub?.spendingCap ? Number(existingSub.spendingCap) : 150.0);
  const currentPause = pauseOnCap ?? (existingSub?.pauseOnCap ?? true);

  const [updated] = await updateSpendingCap(organizationId, currentCap, currentPause);

  // If locked due to spending cap and the user increased their cap above current usage spend, unlock automatically
  if (existingSub?.isLocked && existingSub.lockedReason === 'spending_cap_reached') {
    const projectIds = await getOrganizationProjectIds(organizationId);
    const { start, end } = getMonthBoundaries();
    const counts = await getOrganizationPeriodUsage(projectIds, existingSub.currentPeriodStart || start, existingSub.currentPeriodEnd || end);
    const cost = calculateItemizedUsageCost(counts, Number(existingSub.includedCredit || 39.0));

    if (cost.totalUsageSpend < currentCap) {
      await setOrganizationLock(organizationId, false);
      updated.isLocked = false;
      updated.lockedReason = null;
    }
  }

  return c.json(updated);
});

export default app;
