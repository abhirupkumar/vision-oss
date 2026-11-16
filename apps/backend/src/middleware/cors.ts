
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow localhost during local testing even if pointing to a production backend
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return origin;
    }

    // Allow all origins in development or if ALLOWED_ORIGINS is not set
    if (process.env.NODE_ENV !== 'production' || !process.env.ALLOWED_ORIGINS) {
      return origin || '*';
    }
    
    // In production, allow configured origins
    const allowed = process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
    return allowed.includes(origin) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-vision-share-token', 'x-sigma-share-token', 'x-vision-cache', 'x-sigma-cache'],
  credentials: true,
});
