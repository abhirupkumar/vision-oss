import { Hono } from 'hono';
const app = new Hono();
app.get('/', (c) => c.json({ subscription: null, totalUsage: null, isCommunityEdition: true }));
export default app;
