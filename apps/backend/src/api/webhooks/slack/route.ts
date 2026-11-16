import { Hono } from 'hono';
import { db, Integration } from '@vision/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendSlackNotification, slackInstaller } from '@/lib/integrations/slack.js';

const slackParamsSchema = z.object({
  code: z.string(),
  state: z.string(),
});
const slackMetadataSchema = z.object({
  organizationId: z.string(),
  integrationId: z.string(),
});
const zSlackAuthResponse = z.object({
  ok: z.boolean(),
  app_id: z.string(),
  authed_user: z.object({ id: z.string() }).optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
  access_token: z.string().optional(),
  bot_user_id: z.string().optional(),
  team: z.object({ id: z.string(), name: z.string() }).optional(),
  enterprise: z.object({ name: z.string(), id: z.string() }).nullable().optional(),
  is_enterprise_install: z.boolean().optional(),
  incoming_webhook: z.object({
    channel: z.string(),
    channel_id: z.string(),
    configuration_url: z.string(),
    url: z.string(),
  }),
});

const app = new Hono();

app.get('/', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  const parsedParams = slackParamsSchema.safeParse({ code, state });

  if (!parsedParams.success) {
    return c.json({ error: 'Invalid params' }, 400);
  }

  const verifiedState = await slackInstaller.stateStore?.verifyStateParam(
    new Date(),
    parsedParams.data.state,
  );

  const parsedMetadata = slackMetadataSchema.safeParse(JSON.parse((verifiedState as any)?.metadata ?? '{}'));

  if (!parsedMetadata.success) {
    return c.json({ error: 'Invalid metadata' }, 400);
  }

  const slackOauthAccessUrl = [
    'https://slack.com/api/oauth.v2.access',
    `?client_id=${process.env.SLACK_CLIENT_ID}`,
    `&client_secret=${process.env.SLACK_CLIENT_SECRET}`,
    `&code=${parsedParams.data.code}`,
    `&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}${process.env.SLACK_OAUTH_REDIRECT_URL}`,
  ].join('');

  try {
    const response = await fetch(slackOauthAccessUrl);
    const json = await response.json();
    const parsedJson = zSlackAuthResponse.safeParse(json);

    if (!parsedJson.success) {
      console.error('Failed to parse slack auth response', parsedJson.error, json);
      return c.text('Internal Server Error', 500);
    }

    await sendSlackNotification({
      webhookUrl: parsedJson.data.incoming_webhook.url,
      message: '👋 Hello. You have successfully connected Vision.dev to your Slack workspace.',
    });

    const { organizationId, integrationId } = parsedMetadata.data;

    await db
      .update(Integration)
      .set({
        config: {
          type: 'slack',
          ...(parsedJson.data as any),
        },
        updatedAt: new Date(),
      })
      .where(
        and(eq(Integration.id, integrationId), eq(Integration.organizationId, organizationId)),
      );

    const dashboardUrl =
      process.env.DASHBOARD_URL ||
      process.env.NEXT_PUBLIC_DASHBOARD_URL ||
      process.env.NEXT_PUBLIC_URL ||
      '';
    return c.redirect(`${dashboardUrl}/${organizationId}/settings/integrations`);
  } catch (e) {
    console.error('Slack OAuth Error:', e);
    return c.text('Internal Server Error', 500);
  }
});

export default app;
