import { getTrafficMetricsTool, getTopPagesTool } from './traffic';
import { getEventsDeltaTool } from './events';
import { listFunnelsTool, getFunnelAnalyticsTool } from './funnels';
import { listSegmentsTool } from './segments';
import { createFunnelTool, updateFunnelTool, deleteFunnelTool, createSegmentTool, updateCohortTool, deleteCohortTool } from './mutations';
import { getCohortAnalyticsTool } from './cohorts';
import { getSessionsTool, getSessionMetricsTool } from './sessions';
import { getVisitorsTool, getVisitorMetricsTool } from './visitors';
import { getRevenueMetricsTool } from './revenue';
import { getPerformanceMetricsTool } from './performance';
import { listSessionReplaysTool, getSessionReplayEventsTool } from './replays';

export function createInsightToolkit(projectId: string, env: any) {
  return {
    get_traffic_metrics: getTrafficMetricsTool,
    get_top_pages: getTopPagesTool,
    get_events_delta: getEventsDeltaTool,
    list_funnels: listFunnelsTool,
    get_funnel_analytics: getFunnelAnalyticsTool,
    list_segments: listSegmentsTool,
    get_cohort_analytics: getCohortAnalyticsTool,
    get_sessions: getSessionsTool,
    get_session_metrics: getSessionMetricsTool,
    get_visitors: getVisitorsTool,
    get_visitor_metrics: getVisitorMetricsTool, // Currently mapping to getVisitorsTool internals if needed
    get_revenue_metrics: getRevenueMetricsTool,
    get_performance_metrics: getPerformanceMetricsTool,
    list_session_replays: listSessionReplaysTool,
    get_session_replay_events: getSessionReplayEventsTool,
  };
}

export function createChatToolkit(projectId: string, userId: string, env: any) {
  return {
    ...createInsightToolkit(projectId, env),
    create_funnel: createFunnelTool(userId),
    update_funnel: updateFunnelTool,
    delete_funnel: deleteFunnelTool,
    create_segment: createSegmentTool(),
    update_cohort: updateCohortTool,
    delete_cohort: deleteCohortTool,
  };
}
