import { sendDiscordNotification } from './discord.js';
import { sendSlackNotification } from './slack.js';
import { sendEmail } from '../email.js';
import { buildEventNotificationEmail, buildAnomalyNotificationEmail } from '../email-templates.js';

export interface RecipientTarget {
  type: 'project_owner' | 'org_members' | 'custom_emails';
  roles?: string[];
  emails?: string[];
}

export interface NotificationRuleConfig {
  trigger: 'any_event' | 'event_received' | 'anomaly_detected';
  eventName?: string;
  metric?: string;
  severity?: 'critical' | 'warning' | 'info';
  recipients?: RecipientTarget[];
  emailSubject?: string;
}

function ruleMatchesEvent(config: NotificationRuleConfig, eventName: string): boolean {
  if (config.trigger === 'any_event') return true;
  if (config.trigger === 'event_received') {
    return config.eventName === eventName;
  }
  return false;
}

function ruleMatchesAnomaly(config: NotificationRuleConfig, signals: any[]): boolean {
  if (config.trigger !== 'anomaly_detected') return false;
  if (config.metric && !signals.some(s => s.metric === config.metric)) return false;
  if (config.severity && !signals.some(s => s.severity === config.severity)) return false;
  return true;
}

function buildMessage(projectName: string, eventName: string): string {
  return `New event tracked on project **${projectName}**: ${eventName}`;
}

async function sendToIntegration(integration: any, message: string, platform: 'discord' | 'slack') {
  const config = integration.config as any;
  if (platform === 'discord' && config.url) {
    await sendDiscordNotification({
      webhookUrl: config.url,
      message: `🔔 **Vision Analytics**\n${message}`,
    });
  } else if (platform === 'slack' && config.incoming_webhook?.url) {
    await sendSlackNotification({
      webhookUrl: config.incoming_webhook.url,
      message: `🔔 *Vision Analytics*\n${message}`,
    });
  }
}

async function resolveRecipientEmails(
  ruleConfig: NotificationRuleConfig,
  project: { userId?: string | null; organizationId?: string | null },
): Promise<string[]> {
  const emails = new Set<string>();
  const recipients = ruleConfig.recipients || [{ type: 'project_owner' }];

  const { db, User, Member } = await import('@vision/db');
  const { eq, inArray } = await import('drizzle-orm');

  for (const r of recipients) {
    if (r.type === 'project_owner' && project.userId) {
      const owner = await db.query.User.findFirst({
        where: eq(User.id, project.userId),
        columns: { email: true },
      });
      if (owner?.email) emails.add(owner.email);
    } else if (r.type === 'org_members' && project.organizationId) {
      const members = await db.query.Member.findMany({
        where: eq(Member.organizationId, project.organizationId),
        with: { user: { columns: { email: true } } },
      });
      for (const m of members) {
        if (m.user?.email) {
          if (!r.roles || r.roles.includes(m.role)) {
            emails.add(m.user.email);
          }
        }
      }
    } else if (r.type === 'custom_emails' && Array.isArray(r.emails)) {
      for (const email of r.emails) {
        if (email && email.includes('@')) emails.add(email.trim());
      }
    }
  }

  return Array.from(emails);
}

export async function dispatchNotifications(projectId: string, eventPayload: any) {
  try {
    const { db, Project, NotificationRule, Integration, createNotification } = await import('@vision/db');
    const { eq } = await import('drizzle-orm');

    const project = await db.query.Project.findFirst({
      where: eq(Project.id, projectId),
      columns: { organizationId: true, name: true, userId: true },
    });

    if (!project?.organizationId) return;

    const rules = await db.query.NotificationRule.findMany({
      where: eq(NotificationRule.projectId, projectId),
      with: { integrations: true },
    });

    if (!rules.length) return;

    const eventName = eventPayload.name || 'Page View';
    const message = buildMessage(project.name, eventName);

    const orgIntegrations = await db.query.Integration.findMany({
      where: eq(Integration.organizationId, project.organizationId),
    });

    await Promise.allSettled(
      rules.map(async rule => {
        const config = rule.config as NotificationRuleConfig;

        if (!ruleMatchesEvent(config, eventName)) return;

        let integrations = orgIntegrations;
        if (rule.integrations && rule.integrations.length > 0) {
          const integrationIds = rule.integrations.map((i: any) => i.IntegrationId);
          integrations = orgIntegrations.filter((orgInt: any) =>
            integrationIds.includes(orgInt.id),
          );
        }

        // Store notification in ClickHouse / Tinybird if sendToApp is enabled
        if (rule.sendToApp) {
          await createNotification({
            projectId,
            ruleId: rule.id,
            title: `New event: ${eventName}`,
            message,
            type: 'event',
            severity: 'info',
            source: 'rule',
            payload: JSON.stringify(eventPayload),
          }).catch(err => console.error('[dispatch] createNotification error:', err));
        }

        // Send Mailgun email if sendToEmail is enabled
        if (rule.sendToEmail) {
          const recipientEmails = await resolveRecipientEmails(config, project);
          if (recipientEmails.length > 0) {
            const { subject, html } = buildEventNotificationEmail({
              projectName: project.name,
              eventName,
              payload: eventPayload,
              ruleName: rule.name,
            });
            await sendEmail({
              to: recipientEmails,
              subject: config.emailSubject || subject,
              html,
            });
          }
        }

        // Send to integrations (Slack/Discord)
        await Promise.allSettled(
          integrations.map(async integration => {
            const cfg = integration.config as any;
            if (cfg.type === 'discord') {
              await sendToIntegration(integration, message, 'discord');
            } else if (cfg.type === 'slack') {
              await sendToIntegration(integration, message, 'slack');
            }
          }),
        );
      }),
    );
  } catch (error) {
    console.error('Failed to dispatch notifications', error);
  }
}

export async function dispatchAnomalyNotifications(projectId: string, signals: any[]) {
  try {
    const { db, Project, NotificationRule, Integration, createNotification } = await import('@vision/db');
    const { eq } = await import('drizzle-orm');

    const project = await db.query.Project.findFirst({
      where: eq(Project.id, projectId),
      columns: { organizationId: true, name: true, userId: true },
    });

    if (!project) return;

    const maxSeverity = signals.some((s: any) => s.severity === 'critical') ? 'critical'
      : signals.some((s: any) => s.severity === 'warning') ? 'warning' : 'info';

    // Always create in-app notification in ClickHouse/Tinybird & Postgres
    await createNotification({
      projectId,
      title: `${signals.length} ${signals.length > 1 ? 'anomalies' : 'anomaly'} detected`,
      message: signals.map((s: any) => `${s.label}: ${s.deltaPercent > 0 ? '+' : ''}${s.deltaPercent.toFixed(1)}%`).join(', '),
      type: 'anomaly',
      severity: maxSeverity,
      source: 'anomaly_worker',
      payload: JSON.stringify(signals),
    }).catch(err => console.error('[dispatch] createNotification anomaly error:', err));

    if (!project.organizationId) return;

    const rules = await db.query.NotificationRule.findMany({
      where: eq(NotificationRule.projectId, projectId),
      with: { integrations: true },
    });

    if (!rules.length) return;

    const orgIntegrations = await db.query.Integration.findMany({
      where: eq(Integration.organizationId, project.organizationId),
    });

    await Promise.allSettled(
      rules.map(async rule => {
        const config = rule.config as NotificationRuleConfig;

        if (!ruleMatchesAnomaly(config, signals)) return;

        let integrations = orgIntegrations;
        if (rule.integrations && rule.integrations.length > 0) {
          const integrationIds = rule.integrations.map((i: any) => i.IntegrationId);
          integrations = orgIntegrations.filter((orgInt: any) =>
            integrationIds.includes(orgInt.id),
          );
        }

        if (rule.sendToEmail) {
          const recipientEmails = await resolveRecipientEmails(config, project);
          if (recipientEmails.length > 0) {
            const { subject, html } = buildAnomalyNotificationEmail({
              projectName: project.name,
              signals,
            });
            await sendEmail({
              to: recipientEmails,
              subject: config.emailSubject || subject,
              html,
            });
          }
        }

        const anomalyMsg = `⚠️ **Anomaly Alert for ${project.name}**: ${signals.length} anomaly(ies) detected.`;

        await Promise.allSettled(
          integrations.map(async integration => {
            const cfg = integration.config as any;
            if (cfg.type === 'discord') {
              await sendToIntegration(integration, anomalyMsg, 'discord');
            } else if (cfg.type === 'slack') {
              await sendToIntegration(integration, anomalyMsg, 'slack');
            }
          }),
        );
      }),
    );
  } catch (error) {
    console.error('Failed to dispatch anomaly notifications', error);
  }
}
