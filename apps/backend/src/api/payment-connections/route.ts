import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPaymentConnections, createPaymentConnection, updatePaymentConnection, db, PaymentConnection } from '@vision/db';
import { and, eq } from 'drizzle-orm';

const app = new Hono<{ Variables: { user: any; auth: any } }>();

function maskApiKey(key?: string) {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${'•'.repeat(Math.min(key.length - 4, 12))}${key.slice(-4)}`;
}

function sanitizeConnection(conn: any) {
  if (!conn) return conn;
  const config = { ...(conn.config || {}) };
  if (config.apiKey) {
    config.apiKey = maskApiKey(config.apiKey);
  }
  return {
    ...conn,
    config,
  };
}

function cleanConfigUpdate(existingConfig: Record<string, any>, newConfig: Record<string, any>) {
  const merged = { ...existingConfig };
  for (const [k, v] of Object.entries(newConfig)) {
    if (typeof v === 'string') {
      if (v.includes('•') || v.trim() === '') {
        continue;
      }
      merged[k] = v.trim();
    } else if (v !== undefined && v !== null) {
      merged[k] = v;
    }
  }
  return merged;
}

app.get(
  '/',
  zValidator('query', z.object({ projectId: z.string().min(1) })),
  async (c) => {
    const user = c.get('user') || c.get('auth')?.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { projectId } = c.req.valid('query');
    const connections = await getPaymentConnections(projectId, { pageSize: 50 });
    return c.json({
      ...connections,
      data: connections.data.map(sanitizeConnection),
    });
  }
);

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      provider: z.enum(['stripe', 'paddle', 'polar', 'lemonsqueezy']),
      projectId: z.string().min(1),
      config: z.record(z.string(), z.any()),
    })
  ),
  async (c) => {
    const user = c.get('user') || c.get('auth')?.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');

    // Check if a connection for this provider & project already exists
    const existing = await db.query.PaymentConnection.findFirst({
      where: and(
        eq(PaymentConnection.projectId, body.projectId),
        eq(PaymentConnection.provider, body.provider),
      ),
    });

    let connection;
    if (existing) {
      const mergedConfig = cleanConfigUpdate(existing.config as Record<string, any>, body.config);
      connection = await updatePaymentConnection(existing.id, {
        config: mergedConfig,
        status: 'active',
      });
    } else {
      connection = await createPaymentConnection({
        projectId: body.projectId,
        provider: body.provider,
        status: 'active',
        config: body.config,
      });
    }

    return c.json({ success: true, connection: sanitizeConnection(connection) });
  }
);

export default app;
