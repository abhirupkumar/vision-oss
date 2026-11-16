import { Hono } from 'hono';
import { getSharedProject } from '@vision/db';
import { notFound } from '../../../lib/response.js';

const app = new Hono();

app.get('/', async (c) => {
  const id = c.req.param('id');
  const project = await getSharedProject(id);
  
  if (!project) {
    return notFound();
  }

  return c.json(project);
});

export default app;
