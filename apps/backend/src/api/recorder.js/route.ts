import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  return c.text('// recorder placeholder');
});

export default app;
