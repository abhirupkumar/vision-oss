import { Hono } from 'hono';
import { getLlmEvents, getLlmEventsPage, getLlmTrace, getLlmConversation } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

// GET /projects/:projectId/llm/traces — paginated traces list
// Query params: page (1-based, default 1), limit (default 50, max 50)
app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  try {
    const page = Math.max(1, Number(c.req.query('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 50)));
    const result = await getLlmEventsPage(projectId, page, limit);
    return c.json(result);
  } catch (err) {
    console.error('[llm/traces] error:', err);
    return c.json({ data: [], total: 0, page: 1, limit: 50, totalPages: 0 });
  }
});

// GET /projects/:projectId/llm/traces/:traceId/conversation — full conversation thread by session_id (or fallback trace_id)
app.get('/:traceId/conversation', async (c) => {
  const projectId = c.req.param('projectId');
  const traceId = c.req.param('traceId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  try {
    const refSpans = await getLlmTrace(projectId, traceId);
    const sessionId = refSpans[0]?.session_id || refSpans[0]?.sessionId || '';
    const data = await getLlmConversation(projectId, sessionId || traceId, Boolean(sessionId));
    return c.json(data);
  } catch (err) {
    console.error('[llm/traces/:traceId/conversation] error:', err);
    return c.json([]);
  }
});

// GET /projects/:projectId/llm/traces/:traceId — single trace waterfall
app.get('/:traceId', async (c) => {
  const projectId = c.req.param('projectId');
  const traceId = c.req.param('traceId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  try {
    const data = await getLlmTrace(projectId, traceId);
    return c.json(data);
  } catch (err) {
    console.error('[llm/traces/:traceId] error:', err);
    return c.json([]);
  }
});

export default app;
