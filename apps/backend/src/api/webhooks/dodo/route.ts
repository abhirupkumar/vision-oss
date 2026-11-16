import { Hono } from 'hono';
const app = new Hono();
app.post('/', (c) => c.text('Dodo webhooks disabled in Community Edition', 200));
export default app;
