import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, PaymentConnection, getPaymentConnection, updatePaymentConnection, deletePaymentConnection } from '@vision/db';
import { and, eq } from 'drizzle-orm';

const app = new Hono<{ Variables: { user: any; auth: any } }>();

const KNOWN_PROVIDERS = ['stripe', 'paddle', 'polar', 'lemonsqueezy'];

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

async function findConnection(id: string, projectId?: string) {
  if (KNOWN_PROVIDERS.includes(id) && projectId) {
    return db.query.PaymentConnection.findFirst({
      where: and(
        eq(PaymentConnection.projectId, projectId),
        eq(PaymentConnection.provider, id as any),
      ),
    });
  }

  return getPaymentConnection(id);
}

app.get(
  '/',
  zValidator('query', z.object({ projectId: z.string().optional() })),
  async (c) => {
    const user = c.get('user') || c.get('auth')?.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const { projectId } = c.req.valid('query');
    const connection = await findConnection(id, projectId);

    if (!connection) {
      return c.json({ error: 'Payment connection not found', connected: false, connection: null }, 404);
    }

    return c.json({ connected: connection.status === 'active', connection: sanitizeConnection(connection) });
  },
);

app.put(
  '/',
  zValidator('query', z.object({ projectId: z.string().optional() })),
  zValidator(
    'json',
    z.object({
      config: z.record(z.string(), z.any()).optional(),
      status: z.enum(['active', 'pending', 'failed', 'disconnected']).optional(),
    }),
  ),
  async (c) => {
    const user = c.get('user') || c.get('auth')?.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const { projectId } = c.req.valid('query');
    const existing = await findConnection(id, projectId);

    if (!existing) {
      return c.json({ error: 'Payment connection not found' }, 404);
    }

    const body = c.req.valid('json');
    const newConfig = body.config
      ? cleanConfigUpdate(existing.config as Record<string, any>, body.config)
      : existing.config;

    const updated = await updatePaymentConnection(existing.id, {
      config: newConfig,
      ...(body.status ? { status: body.status } : { status: 'active' }),
    });

    return c.json({ success: true, connection: sanitizeConnection(updated) });
  },
);

app.delete(
  '/',
  zValidator('query', z.object({ projectId: z.string().optional() })),
  async (c) => {
    const user = c.get('user') || c.get('auth')?.user;
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const { projectId } = c.req.valid('query');
    const existing = await findConnection(id, projectId);

    if (!existing) {
      return c.json({ error: 'Payment connection not found' }, 404);
    }

    await deletePaymentConnection(existing.id);
    return c.json({ success: true });
  },
);

export default app;
