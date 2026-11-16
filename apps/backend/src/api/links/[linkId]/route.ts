import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getLink, updateLink, deleteLink } from '@vision/db';
import { canViewLink, canUpdateLink, canDeleteLink } from '../../../lib/permissions/index.js';

const app = new Hono<{ Variables: { user: any } }>();

app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const linkId = c.req.param('linkId');

  if (!(await canViewLink(user, linkId))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const link = await getLink(linkId);
  return c.json(link);
});

app.patch(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().optional(),
      url: z.string().optional(),
      slug: z.string().min(8).optional(),
    })
  ),
  async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const linkId = c.req.param('linkId');
    const { name, url, slug } = c.req.valid('json');

    if (!(await canUpdateLink(user, linkId))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const result = await updateLink(linkId, { name, url, slug });
      return c.json(result);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('unique constraint') && e.message?.includes('slug')) {
        return c.json({ error: 'That slug is already taken.' }, 400);
      }
      return c.json({ error: 'Server error' }, 500);
    }
  }
);

app.delete('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const linkId = c.req.param('linkId');

  if (!(await canDeleteLink(user, linkId))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await deleteLink(linkId);
  return c.json({ success: true });
});

export default app;
