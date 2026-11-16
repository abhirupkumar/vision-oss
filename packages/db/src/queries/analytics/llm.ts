import { uuid } from '../../lib/crypto';
import clickhouse from '../../lib/analytics/clickhouse';
import tinybird from '../../lib/analytics/tinybird';
import kafka from '../../lib/kafka';
import { runQuery, CLICKHOUSE, TINYBIRD } from '../../lib/routing';
import { db } from '../../client';

export interface SaveLlmEventArgs {
  id?: string;                    // span UUID — generated if absent
  projectId: string;
  // Tracing
  traceId?: string;
  parentEventId?: string;
  spanType?: 'generation' | 'span' | 'event' | 'tool' | 'retrieval' | 'embedding';
  // Span identity
  name?: string;
  level?: 'debug' | 'default' | 'warning' | 'error';
  // Timing (wall-clock)
  startTime?: Date | null;
  endTime?: Date | null;
  completionStartTime?: Date | null;
  // Context
  sessionId?: string;
  visitorId?: string;
  userId?: string;
  environment?: string;
  release?: string;
  version?: string;
  tags?: string[];
  // LLM specifics
  model: string;
  provider: string;
  modelParameters?: Record<string, any>;
  requestPath?: string;
  // Token usage
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  usageUnit?: string;
  promptCacheReadTokens?: number | null;
  promptCacheWriteTokens?: number | null;
  reasoningTokens?: number | null;
  usageDetails?: Record<string, any>;
  // Cost
  cost?: number | null;
  costDetails?: Record<string, number>;
  inputCost?: number | null;
  outputCost?: number | null;
  // Content
  payload?: string | null;
  response?: string | null;
  bodyTruncated?: boolean;
  toolCalls?: any;
  toolDefinitions?: any;
  // Latency
  latencyMs?: number;
  ttftMs?: number | null;
  // Status
  status?: string;
  httpStatusCode?: number | null;
  errorMessage?: string;
  errorCode?: string;
  // Template / prompt management
  templateName?: string;
  promptId?: string;
  promptVersion?: number | null;
  // Evaluation
  score?: number | null;
  scores?: any;
  // Misc
  metadata?: any;
  countryCode?: string;
  createdAt?: Date;
}

// ─── Existing queries (unchanged) ───────────────────────────────────────────

export async function getLlmEvents(projectId: string, limit: number = 50) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT *
      FROM llm_events
      WHERE project_id = '${projectId}'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return result?.data || result || [];
  } else {
    return [];
  }
}

/**
 * Paginated list of LLM events with total count.
 * Returns { data, total, page, limit, totalPages }.
 */
export async function getLlmEventsPage(projectId: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const countQuery = `
      SELECT count() AS total
      FROM llm_events
      WHERE project_id = '${projectId}'
    `;
    const dataQuery = `
      SELECT *
      FROM llm_events
      WHERE project_id = '${projectId}'
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [countResult, dataResult] = await Promise.all([
      runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(countQuery),
        [TINYBIRD]: () => tinybird.rawQuery(countQuery),
      }),
      runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(dataQuery),
        [TINYBIRD]: () => tinybird.rawQuery(dataQuery),
      }),
    ]);

    const countData = countResult?.data || countResult || [];
    const total = Number(countData[0]?.total ?? 0);
    const data = dataResult?.data || dataResult || [];

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } else {
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

export async function getLlmMetrics(projectId: string) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT 
        sum(total_tokens) as totalTokens,
        sum(cost) as totalCost,
        avg(latency_ms) as avgLatency,
        avg(ttft_ms) as avgTtft,
        sum(prompt_cache_read_tokens) as cacheReads,
        sum(prompt_cache_write_tokens) as cacheWrites
      FROM llm_events
      WHERE project_id = '${projectId}'
    `;

    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    const data = result?.data || result || [];
    const row = data[0] || {};
    return {
      totalTokens: Number((row as any).totalTokens || 0),
      totalCost: Number((row as any).totalCost || 0),
      avgLatency: Number((row as any).avgLatency || 0),
      avgTtft: Number((row as any).avgTtft || 0),
      cacheReads: Number((row as any).cacheReads || 0),
      cacheWrites: Number((row as any).cacheWrites || 0),
    };
  } else {
    return {
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      avgTtft: 0,
      cacheReads: 0,
      cacheWrites: 0,
    };
  }
}

// ─── New tracing query functions ───────────────────────────────────────────

export async function getLlmTrace(projectId: string, traceId: string) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT *
      FROM llm_events
      WHERE project_id = '${projectId}' AND trace_id = '${traceId}'
      ORDER BY created_at ASC
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return result?.data || result || [];
  } else {
    return [];
  }
}

export async function getLlmToolCallStats(projectId: string) {
  // simplified fallback stub
  return [];
}

export async function getLlmConversation(
  projectId: string,
  id: string,
  bySession: boolean = true
) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const field = bySession ? 'session_id' : 'trace_id';
    const query = `
      SELECT *
      FROM llm_events
      WHERE project_id = '${projectId}' AND ${field} = '${id}'
      ORDER BY created_at ASC
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return result?.data || result || [];
  } else {
    return [];
  }
}

// ─── New analytics query functions ──────────────────────────────────────────

/**
 * Daily or hourly time-series of token usage, cost, and latency.
 * Used to power the trend charts on the LLM observability dashboard.
 */
export async function getLlmTimeSeries(
  projectId: string,
  startDate: Date,
  endDate: Date,
  granularity: 'day' | 'hour' = 'day',
) {
  const fmt = granularity === 'hour' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d';
  const pgTrunc = granularity === 'hour' ? 'hour' : 'day';

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const start = startDate.toISOString().replace('T', ' ').slice(0, 19);
    const end = endDate.toISOString().replace('T', ' ').slice(0, 19);
    const query = `
      SELECT
        formatDateTime(created_at, '${fmt}') AS date,
        sum(total_tokens)   AS totalTokens,
        sum(cost)           AS totalCost,
        avg(latency_ms)     AS avgLatency,
        count()             AS totalCalls,
        countIf(status = 'error' OR status = 'timeout' OR status = 'rate_limited') AS errorCount
      FROM llm_events
      WHERE project_id = '${projectId}'
        AND created_at >= '${start}'
        AND created_at <= '${end}'
      GROUP BY date
      ORDER BY date ASC
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return (result?.data || result || []).map((r: any) => ({
      date: r.date,
      totalTokens: Number(r.totalTokens || 0),
      totalCost: Number(r.totalCost || 0),
      avgLatency: Number(r.avgLatency || 0),
      totalCalls: Number(r.totalCalls || 0),
      errorCount: Number(r.errorCount || 0),
    }));
  } else {
    return [];
  }
}

/**
 * Per-model breakdown: call count, token usage, avg cost, avg latency, error rate.
 * Used by the Model Breakdown table on the LLM observability dashboard.
 */
export async function getLlmModelBreakdown(projectId: string) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT
        model,
        provider,
        count()                    AS totalCalls,
        sum(total_tokens)          AS totalTokens,
        sum(cost)                  AS totalCost,
        avg(cost)                  AS avgCost,
        avg(latency_ms)            AS avgLatency,
        countIf(status = 'error' OR status = 'timeout' OR status = 'rate_limited') AS errorCount
      FROM llm_events
      WHERE project_id = '${projectId}'
      GROUP BY model, provider
      ORDER BY totalCost DESC
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return (result?.data || result || []).map((r: any) => ({
      model: r.model,
      provider: r.provider,
      totalCalls: Number(r.totalCalls || 0),
      totalTokens: Number(r.totalTokens || 0),
      totalCost: Number(r.totalCost || 0),
      avgCost: Number(r.avgCost || 0),
      avgLatency: Number(r.avgLatency || 0),
      errorRate: r.totalCalls > 0 ? Number(r.errorCount || 0) / Number(r.totalCalls) : 0,
    }));
  } else {
    return [];
  }
}

/**
 * Per-template breakdown: call count, avg cost per call, avg quality score.
 * Only includes rows where template_name is set. Returns empty array if none.
 */
export async function getLlmTemplateStats(projectId: string) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT
        template_name               AS templateName,
        count()                     AS totalCalls,
        avg(cost)                   AS avgCost,
        avg(latency_ms)             AS avgLatency,
        avgIf(score, score IS NOT NULL) AS avgScore,
        countIf(status = 'error' OR status = 'timeout' OR status = 'rate_limited') AS errorCount
      FROM llm_events
      WHERE project_id = '${projectId}'
        AND template_name IS NOT NULL
        AND template_name != ''
      GROUP BY template_name
      ORDER BY totalCalls DESC
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return (result?.data || result || []).map((r: any) => ({
      templateName: r.templateName,
      totalCalls: Number(r.totalCalls || 0),
      avgCost: Number(r.avgCost || 0),
      avgLatency: Number(r.avgLatency || 0),
      avgScore: r.avgScore != null ? Number(r.avgScore) : null,
      errorRate: r.totalCalls > 0 ? Number(r.errorCount || 0) / Number(r.totalCalls) : 0,
    }));
  } else {
    return [];
  }
}

/**
 * Cost forecast: current month spend + linear projection to month-end.
 * Returns { mtdCost, projectedMonthCost, daysElapsed, daysInMonth }.
 */
export async function getLlmCostForecast(projectId: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const daysElapsed = Math.max(1, now.getUTCDate());
  const monthStartStr = monthStart.toISOString().replace('T', ' ').slice(0, 19);

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT sum(cost) AS mtdCost
      FROM llm_events
      WHERE project_id = '${projectId}'
        AND created_at >= '${monthStartStr}'
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    const data = result?.data || result || [];
    const mtdCost = Number(data[0]?.mtdCost || 0);
    return {
      mtdCost,
      projectedMonthCost: (mtdCost / daysElapsed) * daysInMonth,
      daysElapsed,
      daysInMonth,
    };
  } else {
    return {
      mtdCost: 0,
      projectedMonthCost: 0,
      daysElapsed,
      daysInMonth,
    };
  }
}

/**
 * Fetches distinct project IDs that logged LLM activity in the given lookback window.
 * Queries ClickHouse/Tinybird with a fallback to relational database projects.
 */
export async function getProjectsWithRecentLlm(hours: number = 24): Promise<string[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    try {
      const query = `
        SELECT DISTINCT project_id AS projectId
        FROM llm_events
        WHERE created_at >= '${cutoffStr}'
      `;
      const result = await runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(query),
        [TINYBIRD]: () => tinybird.rawQuery(query),
      });
      const rows = result?.data || result || [];
      const ids = rows.map((r: any) => r.projectId || r.project_id).filter(Boolean);
      if (ids.length > 0) {
        return ids;
      }
    } catch (e) {
      console.error('[getProjectsWithRecentLlm] analytics query error:', e);
    }
  }

  try {
    const projects = await db.query.Project.findMany({ columns: { id: true } });
    return projects.map(p => p.id);
  } catch (e) {
    console.error('[getProjectsWithRecentLlm] db fallback error:', e);
    return [];
  }
}

/**
 * Per-user breakdown: call count, token usage, total & avg cost, avg latency, error rate, last active.
 * Only includes rows where user_id is set.
 */
export async function getLlmUserBreakdown(projectId: string, limit = 25, page = 1) {
  const offset = (page - 1) * limit;

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const countQuery = `
      SELECT uniq(user_id) AS total
      FROM llm_events
      WHERE project_id = '${projectId}'
        AND user_id IS NOT NULL
        AND user_id != ''
    `;
    const query = `
      SELECT
        user_id                        AS userId,
        count()                        AS totalCalls,
        sum(total_tokens)              AS totalTokens,
        sum(cost)                      AS totalCost,
        avg(cost)                      AS avgCost,
        avg(latency_ms)                AS avgLatency,
        max(created_at)                AS lastActive,
        countIf(status = 'error' OR status = 'timeout' OR status = 'rate_limited') AS errorCount
      FROM llm_events
      WHERE project_id = '${projectId}'
        AND user_id IS NOT NULL
        AND user_id != ''
      GROUP BY user_id
      ORDER BY totalCost DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    const [countResult, result] = await Promise.all([
      runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(countQuery),
        [TINYBIRD]: () => tinybird.rawQuery(countQuery),
      }),
      runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(query),
        [TINYBIRD]: () => tinybird.rawQuery(query),
      }),
    ]);
    const countData = countResult?.data || countResult || [];
    const total = Number(countData[0]?.total ?? 0);
    const rawData = result?.data || result || [];
    const data = rawData.map((r: any) => ({
      userId: r.userId,
      totalCalls: Number(r.totalCalls || 0),
      totalTokens: Number(r.totalTokens || 0),
      totalCost: Number(r.totalCost || 0),
      avgCost: Number(r.avgCost || 0),
      avgLatency: Number(r.avgLatency || 0),
      lastActive: r.lastActive ? new Date(r.lastActive) : null,
      errorRate: r.totalCalls > 0 ? Number(r.errorCount || 0) / Number(r.totalCalls) : 0,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } else {
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

/**
 * Per-country breakdown: call count, token usage, cost, latency, error rate.
 * Only includes rows where country_code is set.
 */
export async function getLlmCountryBreakdown(projectId: string, limit = 50) {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT
        country_code                   AS countryCode,
        count()                        AS totalCalls,
        sum(total_tokens)              AS totalTokens,
        sum(cost)                      AS totalCost,
        avg(cost)                      AS avgCost,
        avg(latency_ms)                AS avgLatency,
        countIf(status = 'error' OR status = 'timeout' OR status = 'rate_limited') AS errorCount
      FROM llm_events
      WHERE project_id = '${projectId}'
        AND country_code IS NOT NULL
        AND country_code != ''
      GROUP BY country_code
      ORDER BY totalCalls DESC
      LIMIT ${limit}
    `;
    const result = await runQuery({
      [CLICKHOUSE]: () => clickhouse.rawQuery(query),
      [TINYBIRD]: () => tinybird.rawQuery(query),
    });
    return (result?.data || result || []).map((r: any) => ({
      countryCode: r.countryCode,
      totalCalls: Number(r.totalCalls || 0),
      totalTokens: Number(r.totalTokens || 0),
      totalCost: Number(r.totalCost || 0),
      avgCost: Number(r.avgCost || 0),
      avgLatency: Number(r.avgLatency || 0),
      errorRate: r.totalCalls > 0 ? Number(r.errorCount || 0) / Number(r.totalCalls) : 0,
    }));
  } else {
    return [];
  }
}

// ─── Existing save functions (unchanged) ────────────────────────────────────

export async function saveLlmEvent(args: SaveLlmEventArgs) {
  return clickhouseSaveLlmEvent(args);
}

async function clickhouseSaveLlmEvent(args: SaveLlmEventArgs) {
  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;

  const eventId = args.id ?? uuid();
  const now = args.createdAt ?? new Date();

  const message = {
    id: eventId,
    project_id: args.projectId,
    trace_id: args.traceId || '',
    parent_event_id: args.parentEventId || '',
    span_type: args.spanType || 'generation',
    name: args.name || '',
    level: args.level || 'default',
    start_time: args.startTime ? getUTCString(args.startTime) : null,
    end_time: args.endTime ? getUTCString(args.endTime) : null,
    completion_start_time: args.completionStartTime ? getUTCString(args.completionStartTime) : null,
    session_id: args.sessionId || '',
    visitor_id: args.visitorId || '',
    user_id: args.userId || '',
    environment: args.environment || '',
    release: args.release || '',
    version: args.version || '',
    tags: args.tags ? JSON.stringify(args.tags) : '[]',
    model: args.model,
    provider: args.provider,
    model_parameters: args.modelParameters ? JSON.stringify(args.modelParameters) : '{}',
    request_path: args.requestPath || '',
    prompt_tokens: args.promptTokens ?? null,
    completion_tokens: args.completionTokens ?? null,
    total_tokens: args.totalTokens ?? null,
    usage_unit: args.usageUnit || 'tokens',
    prompt_cache_read_tokens: args.promptCacheReadTokens ?? null,
    prompt_cache_write_tokens: args.promptCacheWriteTokens ?? null,
    reasoning_tokens: args.reasoningTokens ?? null,
    usage_details: args.usageDetails ? JSON.stringify(args.usageDetails) : '{}',
    latency_ms: args.latencyMs ?? 0,
    cost: args.cost ?? null,
    cost_details: args.costDetails ? JSON.stringify(args.costDetails) : '{}',
    input_cost: args.inputCost ?? null,
    output_cost: args.outputCost ?? null,
    payload: args.payload || '',
    response: args.response || '',
    body_truncated: args.bodyTruncated ? 1 : 0,
    tool_calls: args.toolCalls ? JSON.stringify(args.toolCalls) : '[]',
    tool_definitions: args.toolDefinitions ? JSON.stringify(args.toolDefinitions) : '[]',
    created_at: getUTCString(now),
    status: args.status || '',
    http_status_code: args.httpStatusCode ?? null,
    error_message: args.errorMessage || '',
    error_code: args.errorCode || '',
    template_name: args.templateName || '',
    prompt_id: args.promptId || '',
    prompt_version: args.promptVersion ?? null,
    score: args.score ?? null,
    scores: args.scores ? JSON.stringify(args.scores) : '[]',
    metadata: args.metadata ? JSON.stringify(args.metadata) : '{}',
    country_code: args.countryCode || '',
    ttft_ms: args.ttftMs ?? null,
  };

  if (kafka.enabled) {
    await kafka.sendMessage('llm_events', message);
  } else {
    await insert('llm_events', [message]);
  }
}

export async function updateLlmScore(projectId: string, eventId: string, score: number) {
  if (!tinybird.enabled) {
    await clickhouse.rawQuery(
      `ALTER TABLE llm_events UPDATE score = ${score} WHERE id = '${eventId}' AND project_id = '${projectId}'`
    );
  }
}
