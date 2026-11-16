import { eq, lte, and, sql } from 'drizzle-orm';
import { db } from '../client';
import { OrganizationSubscription, Project, Member } from '../schema';
import redis from '../lib/redis';

export async function getOrganizationSubscription(organizationId: string) {
  return db.query.OrganizationSubscription.findFirst({
    where: eq(OrganizationSubscription.organizationId, organizationId),
  });
}

export async function upsertOrganizationSubscription(data: {
  organizationId: string;
  dodoSubscriptionId?: string;
  dodoCustomerId?: string;
  dodoPaymentId?: string;
  dodoProductId?: string;
  status?: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'cancelled' | 'inactive';
  planTier?: string;
  baseAmount?: string;
  includedCredit?: string;
  spendingCap?: string;
  pauseOnCap?: boolean;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const existing = await getOrganizationSubscription(data.organizationId);

  if (existing) {
    const [updated] = await db
      .update(OrganizationSubscription)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(OrganizationSubscription.organizationId, data.organizationId))
      .returning();

    try {
      if (redis.enabled && data.status) {
        const isLocked = !(data.status === 'active' || data.status === 'trialing');
        await redis.client.set(`org:${data.organizationId}:locked`, isLocked, 3600);
      }
    } catch {}

    return updated;
  }

  const [created] = await db
    .insert(OrganizationSubscription)
    .values({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  try {
    if (redis.enabled && data.status) {
      const isLocked = !(data.status === 'active' || data.status === 'trialing');
      await redis.client.set(`org:${data.organizationId}:locked`, isLocked, 3600);
    }
  } catch {}

  return created;
}

export async function updateSpendingCap(
  organizationId: string,
  spendingCap: number,
  pauseOnCap = true
) {
  return db
    .update(OrganizationSubscription)
    .set({
      spendingCap: spendingCap.toFixed(2),
      pauseOnCap,
      updatedAt: new Date(),
    })
    .where(eq(OrganizationSubscription.organizationId, organizationId))
    .returning();
}

export async function setOrganizationLock(
  organizationId: string,
  isLocked: boolean,
  reason?: string
) {
  try {
    if (redis.enabled) {
      await redis.client.set(`org:${organizationId}:locked`, isLocked, 3600);
    }
  } catch {}
  return db
    .update(OrganizationSubscription)
    .set({
      isLocked,
      lockedReason: isLocked ? reason || 'unpaid' : null,
      lockedAt: isLocked ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(OrganizationSubscription.organizationId, organizationId))
    .returning();
}

export async function isOrganizationLocked(organizationId: string): Promise<boolean> {
  const cacheKey = `org:${organizationId}:locked`;
  try {
    if (redis.enabled) {
      const cached = await redis.client.get(cacheKey);
      if (cached !== null) {
        return cached === true || cached === 'true' || cached === 1;
      }
    }
  } catch {}

  const sub = await getOrganizationSubscription(organizationId);

  // If no subscription exists at all, account has no plan -> locked
  if (!sub) {
    try {
      if (redis.enabled) await redis.client.set(cacheKey, true, 60);
    } catch {}
    return true;
  }

  // If subscription is explicitly locked (e.g. cap reached or flagged by admin/unpaid)
  if (sub.isLocked) {
    try {
      if (redis.enabled) await redis.client.set(cacheKey, true, 60);
    } catch {}
    return true;
  }

  // Only 'active' and 'trialing' subscriptions can ingest data
  const isActive = sub.status === 'active' || sub.status === 'trialing';
  if (!isActive) {
    try {
      if (redis.enabled) await redis.client.set(cacheKey, true, 60);
    } catch {}
    return true;
  }

  // If current period has ended and was not renewed -> expired -> locked
  if (sub.currentPeriodEnd) {
    const now = new Date();
    if (now > new Date(sub.currentPeriodEnd)) {
      try {
        if (redis.enabled) await redis.client.set(cacheKey, true, 60);
      } catch {}
      return true;
    }
  }

  try {
    if (redis.enabled) {
      await redis.client.set(cacheKey, false, 60);
    }
  } catch {}
  return false;
}

export async function isProjectLocked(projectId: string): Promise<boolean> {
  const cacheKey = `project:${projectId}:locked`;
  try {
    if (redis.enabled) {
      const cached = await redis.client.get(cacheKey);
      if (cached !== null) {
        return cached === true || cached === 'true' || cached === 1;
      }
    }
  } catch {}

  const project = await db.query.Project.findFirst({
    where: eq(Project.id, projectId),
    columns: { id: true, organizationId: true, userId: true },
  });

  if (!project) {
    return true; // Project doesn't exist -> locked
  }

  let locked = true;

  if (project.organizationId) {
    locked = await isOrganizationLocked(project.organizationId);
  } else if (project.userId) {
    // If project has no direct organizationId, check all organizations the user belongs to
    const userMembers = await db.query.Member.findMany({
      where: eq(Member.userId, project.userId),
      columns: { organizationId: true },
    });

    if (userMembers.length > 0) {
      let anyUnlocked = false;
      for (const m of userMembers) {
        const orgLocked = await isOrganizationLocked(m.organizationId);
        if (!orgLocked) {
          anyUnlocked = true;
          break;
        }
      }
      locked = !anyUnlocked;
    } else {
      // User has no organizations at all -> no plan -> locked
      locked = true;
    }
  }

  try {
    if (redis.enabled) {
      await redis.client.set(cacheKey, locked, 60);
    }
  } catch {}

  return locked;
}

export async function updateSubscriptionWarning(
  organizationId: string,
  warning: '80_percent' | '100_percent' | 'cap_reached' | null
) {
  return db
    .update(OrganizationSubscription)
    .set({
      lastWarningSent: warning,
      updatedAt: new Date(),
    })
    .where(eq(OrganizationSubscription.organizationId, organizationId));
}

export async function recordOverageCharge(
  organizationId: string,
  overageAmount: number,
  newPeriodStart: Date,
  newPeriodEnd: Date
) {
  try {
    if (redis.enabled) {
      await redis.client.set(`org:${organizationId}:locked`, false, 3600);
    }
  } catch {}

  return db
    .update(OrganizationSubscription)
    .set({
      lastOverageChargedAt: new Date(),
      lastOverageAmount: overageAmount.toFixed(2),
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      lastWarningSent: null,
      isLocked: false,
      lockedReason: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(OrganizationSubscription.organizationId, organizationId))
    .returning();
}

export async function getActiveSubscriptions() {
  return db.query.OrganizationSubscription.findMany({
    where: eq(OrganizationSubscription.status, 'active'),
  });
}

export async function getExpiringSubscriptions(now = new Date()) {
  return db.query.OrganizationSubscription.findMany({
    where: and(
      eq(OrganizationSubscription.status, 'active'),
      lte(OrganizationSubscription.currentPeriodEnd, now)
    ),
  });
}

export async function getOrganizationProjectIds(organizationId: string): Promise<string[]> {
  const projects = await db.query.Project.findMany({
    where: eq(Project.organizationId, organizationId),
    columns: { id: true },
  });
  return projects.map(p => p.id);
}
