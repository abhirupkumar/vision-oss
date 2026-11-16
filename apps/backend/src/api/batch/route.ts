import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

import sendApp from '../send/route.js';

app.post('/', zValidator('json', z.array(z.any())), async (c) => {
  try {
    const body = c.req.valid('json');
    const errors = [];
    let index = 0;
    let cache = null;

    for (const data of body) {
      // Create a mock fetch request to pass to the send app
      const req = new Request(c.req.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });

      const response = await sendApp.request(req);
      const responseJson = await response.json();

      if (!response.ok) {
        errors.push({ index, response: responseJson });
      } else {
        cache ??= (responseJson as any).cache;
      }
      index++;
    }

    return c.json({
      size: body.length,
      processed: body.length - errors.length,
      errors: errors.length,
      details: errors,
      cache,
    });
  } catch (e) {
    return c.json({ error: 'Server error' }, 500);
  }
});

export default app;
