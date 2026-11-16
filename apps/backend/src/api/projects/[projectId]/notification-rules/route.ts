import { Hono } from 'hono';
import { canViewProject } from '@/lib/permissions/project.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getNotificationRules,
  getNotificationRule,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
} from '@vision/db';

const app = new Hono<{ Variables: { auth: any } }>();

app.use('*', async (c, next) => {
  const auth = c.get('auth');
  const projectId = c.req.param('projectId');
  if (!(await canViewProject(auth, projectId))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

const recipientSchema = z.object({
  type: z.enum(['project_owner', 'org_members', 'custom_emails']),
  roles: z.array(z.string()).optional(),
  emails: z.array(z.string().email()).optional(),
});

const configSchema = z.object({
  trigger: z.enum(['any_event', 'event_received', 'anomaly_detected']),
  eventName: z.string().optional(),
  metric: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info']).optional(),
  recipients: z.array(recipientSchema).optional(),
  emailSubject: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
  config: configSchema,
  sendToApp: z.boolean().default(true),
  sendToEmail: z.boolean().default(false),
  integrationIds: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: configSchema.optional(),
  sendToApp: z.boolean().optional(),
  sendToEmail: z.boolean().optional(),
  integrationIds: z.array(z.string()).optional(),
});

// List all rules for a project
app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const rules = await getNotificationRules(projectId);
  return c.json({ rules });
});

// Get a single rule
app.get('/:ruleId', async (c) => {
  const ruleId = c.req.param('ruleId');
  const rule = await getNotificationRule(ruleId);
  if (!rule) return c.json({ error: 'Not found' }, 404);
  return c.json({ rule });
});

// Create a new rule
app.post('/', zValidator('json', createSchema), async (c) => {
  const projectId = c.req.param('projectId');
  const body = c.req.valid('json');
  const rule = await createNotificationRule({ projectId, ...body });
  return c.json({ rule }, 201);
});

// Update a rule
app.patch('/:ruleId', zValidator('json', updateSchema), async (c) => {
  const ruleId = c.req.param('ruleId');
  const body = c.req.valid('json');
  const rule = await updateNotificationRule(ruleId, body);
  return c.json({ rule });
});

// Delete a rule
app.delete('/:ruleId', async (c) => {
  const ruleId = c.req.param('ruleId');
  const deleted = await deleteNotificationRule(ruleId);
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true });
});

export default app;
