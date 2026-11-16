import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  // Process Clerk webhook
  // TODO: Use svix to verify clerk signature
  const body = await c.req.json();
  const eventType = body.type;
  
  if (eventType === 'user.created') {
    // Sync user logic
  }
  
  return c.json({ received: true });
});

export default app;
