import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  return c.json({ 
    success: true, 
    message: 'This endpoint is deprecated. Batch insertion is now handled internally by the batch-worker microservice.' 
  }, 200);
});

export default app;
