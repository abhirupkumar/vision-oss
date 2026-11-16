import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { IntegrationToNotificationRule, NotificationRule } from '../schema';
import { uuid } from '../lib/crypto';

export async function getNotificationRules(projectId: string) {
  return db.query.NotificationRule.findMany({
    where: eq(NotificationRule.projectId, projectId),
    with: {
      integrations: true,
    },
    orderBy: [desc(NotificationRule.createdAt)],
  });
}

export async function getNotificationRule(ruleId: string) {
  return db.query.NotificationRule.findFirst({
    where: eq(NotificationRule.id, ruleId),
    with: { integrations: true },
  });
}

export async function createNotificationRule(data: {
  projectId: string;
  name: string;
  config: Record<string, any>;
  sendToApp?: boolean;
  sendToEmail?: boolean;
  integrationIds?: string[];
}) {
  return await db.transaction(async tx => {
    const { integrationIds, ...rest } = data;
    const [rule] = await tx
      .insert(NotificationRule)
      .values({
        ...rest,
        id: uuid(),
        sendToApp: data.sendToApp ?? false,
        sendToEmail: data.sendToEmail ?? false,
      })
      .returning();

    if (integrationIds && integrationIds.length > 0) {
      await tx.insert(IntegrationToNotificationRule).values(
        integrationIds.map(id => ({
          NotificationRuleId: rule.id,
          IntegrationId: id,
        })),
      );
    }

    return await tx.query.NotificationRule.findFirst({
      where: eq(NotificationRule.id, rule.id),
      with: { integrations: true },
    });
  });
}

export async function updateNotificationRule(
  ruleId: string,
  data: {
    name?: string;
    config?: Record<string, any>;
    sendToApp?: boolean;
    sendToEmail?: boolean;
    integrationIds?: string[];
  },
) {
  return await db.transaction(async tx => {
    const { integrationIds, ...rest } = data;

    if (Object.keys(rest).length > 0) {
      await tx
        .update(NotificationRule)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(NotificationRule.id, ruleId));
    }

    if (integrationIds !== undefined) {
      await tx
        .delete(IntegrationToNotificationRule)
        .where(eq(IntegrationToNotificationRule.NotificationRuleId, ruleId));

      if (integrationIds.length > 0) {
        await tx.insert(IntegrationToNotificationRule).values(
          integrationIds.map(id => ({
            NotificationRuleId: ruleId,
            IntegrationId: id,
          })),
        );
      }
    }

    return await tx.query.NotificationRule.findFirst({
      where: eq(NotificationRule.id, ruleId),
      with: { integrations: true },
    });
  });
}

export async function deleteNotificationRule(ruleId: string) {
  const [deleted] = await db
    .delete(NotificationRule)
    .where(eq(NotificationRule.id, ruleId))
    .returning();
  return deleted;
}
