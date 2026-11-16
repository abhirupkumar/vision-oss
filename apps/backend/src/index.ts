// THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY.
// Run `pnpm routes:generate` to update this file.

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';
import { requireAuth } from './middleware/clerk.js';

import admin_organizationsRoute from './api/admin/organizations/route.js';
import admin_projectsRoute from './api/admin/projects/route.js';
import admin_usersRoute from './api/admin/users/route.js';
import ai_chat_streamRoute from './api/ai/chat/stream/route.js';
import auth_verifyRoute from './api/auth/verify/route.js';
import batchRoute from './api/batch/route.js';
import configRoute from './api/config/route.js';
import errorsRoute from './api/errors/route.js';
import flushQueueRoute from './api/flush-queue/route.js';
import heartbeatRoute from './api/heartbeat/route.js';
import insights_configRoute from './api/insights/config/route.js';
import insights_generateRoute from './api/insights/generate/route.js';
import insightsRoute from './api/insights/route.js';
import links_linkIdRoute from './api/links/[linkId]/route.js';
import linksRoute from './api/links/route.js';
import llmProxyRoute from './api/llm-proxy/route.js';
import me_billingRoute from './api/me/billing/route.js';
import me_organizationsRoute from './api/me/organizations/route.js';
import me_passwordRoute from './api/me/password/route.js';
import me_projectsRoute from './api/me/projects/route.js';
import meRoute from './api/me/route.js';
import organizations_joinRoute from './api/organizations/join/route.js';
import organizations_validateSlugRoute from './api/organizations/validate-slug/route.js';
import organizations_organizationId_billingRoute from './api/organizations/[organizationId]/billing/route.js';
import organizations_organizationId_invites_inviteIdRoute from './api/organizations/[organizationId]/invites/[inviteId]/route.js';
import organizations_organizationId_invitesRoute from './api/organizations/[organizationId]/invites/route.js';
import organizations_organizationId_projectsRoute from './api/organizations/[organizationId]/projects/route.js';
import organizations_organizationId_users_userIdRoute from './api/organizations/[organizationId]/users/[userId]/route.js';
import organizations_organizationId_usersRoute from './api/organizations/[organizationId]/users/route.js';
import organizations_organizationIdRoute from './api/organizations/[organizationId]/route.js';
import organizationsRoute from './api/organizations/route.js';
import paymentConnections_idRoute from './api/payment-connections/[id]/route.js';
import paymentConnectionsRoute from './api/payment-connections/route.js';
import pixels_pixelIdRoute from './api/pixels/[pixelId]/route.js';
import pixelsRoute from './api/pixels/route.js';
import projects_projectId_activeRoute from './api/projects/[projectId]/active/route.js';
import projects_projectId_channelRoute from './api/projects/[projectId]/channel/route.js';
import projects_projectId_daterangeRoute from './api/projects/[projectId]/daterange/route.js';
import projects_projectId_errors_byPageRoute from './api/projects/[projectId]/errors/by-page/route.js';
import projects_projectId_errors_chartRoute from './api/projects/[projectId]/errors/chart/route.js';
import projects_projectId_errors_groups_fingerprintRoute from './api/projects/[projectId]/errors/groups/[fingerprint]/route.js';
import projects_projectId_errors_summaryRoute from './api/projects/[projectId]/errors/summary/route.js';
import projects_projectId_errors_typesRoute from './api/projects/[projectId]/errors/types/route.js';
import projects_projectId_errorsRoute from './api/projects/[projectId]/errors/route.js';
import projects_projectId_eventData_eventsRoute from './api/projects/[projectId]/event-data/events/route.js';
import projects_projectId_eventData_fieldsRoute from './api/projects/[projectId]/event-data/fields/route.js';
import projects_projectId_eventData_propertiesRoute from './api/projects/[projectId]/event-data/properties/route.js';
import projects_projectId_eventData_statsRoute from './api/projects/[projectId]/event-data/stats/route.js';
import projects_projectId_eventData_valuesRoute from './api/projects/[projectId]/event-data/values/route.js';
import projects_projectId_eventData_eventIdRoute from './api/projects/[projectId]/event-data/[eventId]/route.js';
import projects_projectId_events_seriesRoute from './api/projects/[projectId]/events/series/route.js';
import projects_projectId_eventsRoute from './api/projects/[projectId]/events/route.js';
import projects_projectId_llm_costForecastRoute from './api/projects/[projectId]/llm/cost-forecast/route.js';
import projects_projectId_llm_countryBreakdownRoute from './api/projects/[projectId]/llm/country-breakdown/route.js';
import projects_projectId_llm_metricsRoute from './api/projects/[projectId]/llm/metrics/route.js';
import projects_projectId_llm_modelBreakdownRoute from './api/projects/[projectId]/llm/model-breakdown/route.js';
import projects_projectId_llm_scoresRoute from './api/projects/[projectId]/llm/scores/route.js';
import projects_projectId_llm_seriesRoute from './api/projects/[projectId]/llm/series/route.js';
import projects_projectId_llm_templateStatsRoute from './api/projects/[projectId]/llm/template-stats/route.js';
import projects_projectId_llm_tracesRoute from './api/projects/[projectId]/llm/traces/route.js';
import projects_projectId_llm_userBreakdownRoute from './api/projects/[projectId]/llm/user-breakdown/route.js';
import projects_projectId_metrics_batchRoute from './api/projects/[projectId]/metrics/batch/route.js';
import projects_projectId_metrics_expandedRoute from './api/projects/[projectId]/metrics/expanded/route.js';
import projects_projectId_metricsRoute from './api/projects/[projectId]/metrics/route.js';
import projects_projectId_notificationRulesRoute from './api/projects/[projectId]/notification-rules/route.js';
import projects_projectId_notificationsRoute from './api/projects/[projectId]/notifications/route.js';
import projects_projectId_pageviewsRoute from './api/projects/[projectId]/pageviews/route.js';
import projects_projectId_performanceRoute from './api/projects/[projectId]/performance/route.js';
import projects_projectId_replays_savedRoute from './api/projects/[projectId]/replays/saved/route.js';
import projects_projectId_replays_sessionId_chunksRoute from './api/projects/[projectId]/replays/[sessionId]/chunks/route.js';
import projects_projectId_replaysRoute from './api/projects/[projectId]/replays/route.js';
import projects_projectId_revenue_metricsRoute from './api/projects/[projectId]/revenue/metrics/route.js';
import projects_projectId_revenue_sessionsRoute from './api/projects/[projectId]/revenue/sessions/route.js';
import projects_projectId_revenue_statsRoute from './api/projects/[projectId]/revenue/stats/route.js';
import projects_projectId_revenue_unitEconomicsRoute from './api/projects/[projectId]/revenue/unit-economics/route.js';
import projects_projectId_revenue_usersRoute from './api/projects/[projectId]/revenue/users/route.js';
import projects_projectId_revenueRoute from './api/projects/[projectId]/revenue/route.js';
import projects_projectId_segments_segmentIdRoute from './api/projects/[projectId]/segments/[segmentId]/route.js';
import projects_projectId_segmentsRoute from './api/projects/[projectId]/segments/route.js';
import projects_projectId_sessionData_propertiesRoute from './api/projects/[projectId]/session-data/properties/route.js';
import projects_projectId_sessionData_valuesRoute from './api/projects/[projectId]/session-data/values/route.js';
import projects_projectId_sessions_statsRoute from './api/projects/[projectId]/sessions/stats/route.js';
import projects_projectId_sessions_weeklyRoute from './api/projects/[projectId]/sessions/weekly/route.js';
import projects_projectId_sessions_sessionId_activityRoute from './api/projects/[projectId]/sessions/[sessionId]/activity/route.js';
import projects_projectId_sessions_sessionId_dataRoute from './api/projects/[projectId]/sessions/[sessionId]/data/route.js';
import projects_projectId_sessions_sessionId_propertiesRoute from './api/projects/[projectId]/sessions/[sessionId]/properties/route.js';
import projects_projectId_sessions_sessionIdRoute from './api/projects/[projectId]/sessions/[sessionId]/route.js';
import projects_projectId_sessionsRoute from './api/projects/[projectId]/sessions/route.js';
import projects_projectId_statsRoute from './api/projects/[projectId]/stats/route.js';
import projects_projectId_transferRoute from './api/projects/[projectId]/transfer/route.js';
import projects_projectId_valuesRoute from './api/projects/[projectId]/values/route.js';
import projects_projectId_visitors_visitorId_activityRoute from './api/projects/[projectId]/visitors/[visitorId]/activity/route.js';
import projects_projectId_visitors_visitorIdRoute from './api/projects/[projectId]/visitors/[visitorId]/route.js';
import projects_projectId_visitorsRoute from './api/projects/[projectId]/visitors/route.js';
import projects_projectIdRoute from './api/projects/[projectId]/route.js';
import projectsRoute from './api/projects/route.js';
import pushSubscriptionsRoute from './api/push-subscriptions/route.js';
import realtime_projectIdRoute from './api/realtime/[projectId]/route.js';
import recordRoute from './api/record/route.js';
import recorderJsRoute from './api/recorder.js/route.js';
import reports_attributionRoute from './api/reports/attribution/route.js';
import reports_breakdownRoute from './api/reports/breakdown/route.js';
import reports_funnelRoute from './api/reports/funnel/route.js';
import reports_goalRoute from './api/reports/goal/route.js';
import reports_journeyRoute from './api/reports/journey/route.js';
import reports_performanceRoute from './api/reports/performance/route.js';
import reports_retentionRoute from './api/reports/retention/route.js';
import reports_revenueRoute from './api/reports/revenue/route.js';
import reports_utmRoute from './api/reports/utm/route.js';
import reports_idRoute from './api/reports/[id]/route.js';
import reportsRoute from './api/reports/route.js';
import sendRoute from './api/send/route.js';
import share_idRoute from './api/share/[id]/route.js';
import users_id_organizationsRoute from './api/users/[id]/organizations/route.js';
import users_id_projectsRoute from './api/users/[id]/projects/route.js';
import users_idRoute from './api/users/[id]/route.js';
import usersRoute from './api/users/route.js';
import webhooks_clerkRoute from './api/webhooks/clerk/route.js';
import webhooks_dodoRoute from './api/webhooks/dodo/route.js';
import webhooks_payments_providerRoute from './api/webhooks/payments/[provider]/route.js';
import webhooks_slackRoute from './api/webhooks/slack/route.js';


const app = new Hono<{ Variables: { auth: any } }>();

app.onError((err, c) => {
  console.error('[Global Error]:', err);
  return c.text('Internal Server Error', 500);
});

// Global middleware
app.use('*', async (c, next) => {
  // Inject Cloudflare Worker bindings into process.env so our node-compatible code works
  if (c.env) {
    Object.assign(process.env, c.env);
  }
  await next();
});
app.use('*', loggerMiddleware);
app.use('*', corsMiddleware);

// Public routes
app.route('/auth/verify', auth_verifyRoute);
app.route('/batch', batchRoute);
app.route('/config', configRoute);
app.route('/flush-queue', flushQueueRoute);
app.route('/heartbeat', heartbeatRoute);
app.route('/llm-proxy', llmProxyRoute);
app.route('/record', recordRoute);
app.route('/recorder.js', recorderJsRoute);
app.route('/send', sendRoute);
app.route('/share/:id', share_idRoute);
app.route('/webhooks/clerk', webhooks_clerkRoute);
app.route('/webhooks/dodo', webhooks_dodoRoute);
app.route('/webhooks/payments/:provider', webhooks_payments_providerRoute);
app.route('/webhooks/slack', webhooks_slackRoute);


const api = new Hono<{ Variables: { auth: any } }>();
api.use('*', requireAuth());

api.onError((err, c) => {
  console.error('[API Error]:', err);
  return c.text('Internal Server Error', 500);
});

// Protected routes
api.route('/admin/organizations', admin_organizationsRoute);
api.route('/admin/projects', admin_projectsRoute);
api.route('/admin/users', admin_usersRoute);
api.route('/ai/chat/stream', ai_chat_streamRoute);
api.route('/errors', errorsRoute);
api.route('/insights/config', insights_configRoute);
api.route('/insights/generate', insights_generateRoute);
api.route('/insights', insightsRoute);
api.route('/links/:linkId', links_linkIdRoute);
api.route('/links', linksRoute);
api.route('/me/billing', me_billingRoute);
api.route('/me/organizations', me_organizationsRoute);
api.route('/me/password', me_passwordRoute);
api.route('/me/projects', me_projectsRoute);
api.route('/me', meRoute);
api.route('/organizations/join', organizations_joinRoute);
api.route('/organizations/validate-slug', organizations_validateSlugRoute);
api.route('/organizations/:organizationId/billing', organizations_organizationId_billingRoute);
api.route('/organizations/:organizationId/invites/:inviteId', organizations_organizationId_invites_inviteIdRoute);
api.route('/organizations/:organizationId/invites', organizations_organizationId_invitesRoute);
api.route('/organizations/:organizationId/projects', organizations_organizationId_projectsRoute);
api.route('/organizations/:organizationId/users/:userId', organizations_organizationId_users_userIdRoute);
api.route('/organizations/:organizationId/users', organizations_organizationId_usersRoute);
api.route('/organizations/:organizationId', organizations_organizationIdRoute);
api.route('/organizations', organizationsRoute);
api.route('/payment-connections/:id', paymentConnections_idRoute);
api.route('/payment-connections', paymentConnectionsRoute);
api.route('/pixels/:pixelId', pixels_pixelIdRoute);
api.route('/pixels', pixelsRoute);
api.route('/projects/:projectId/active', projects_projectId_activeRoute);
api.route('/projects/:projectId/channel', projects_projectId_channelRoute);
api.route('/projects/:projectId/daterange', projects_projectId_daterangeRoute);
api.route('/projects/:projectId/errors/by-page', projects_projectId_errors_byPageRoute);
api.route('/projects/:projectId/errors/chart', projects_projectId_errors_chartRoute);
api.route('/projects/:projectId/errors/groups/:fingerprint', projects_projectId_errors_groups_fingerprintRoute);
api.route('/projects/:projectId/errors/summary', projects_projectId_errors_summaryRoute);
api.route('/projects/:projectId/errors/types', projects_projectId_errors_typesRoute);
api.route('/projects/:projectId/errors', projects_projectId_errorsRoute);
api.route('/projects/:projectId/event-data/events', projects_projectId_eventData_eventsRoute);
api.route('/projects/:projectId/event-data/fields', projects_projectId_eventData_fieldsRoute);
api.route('/projects/:projectId/event-data/properties', projects_projectId_eventData_propertiesRoute);
api.route('/projects/:projectId/event-data/stats', projects_projectId_eventData_statsRoute);
api.route('/projects/:projectId/event-data/values', projects_projectId_eventData_valuesRoute);
api.route('/projects/:projectId/event-data/:eventId', projects_projectId_eventData_eventIdRoute);
api.route('/projects/:projectId/events/series', projects_projectId_events_seriesRoute);
api.route('/projects/:projectId/events', projects_projectId_eventsRoute);
api.route('/projects/:projectId/llm/cost-forecast', projects_projectId_llm_costForecastRoute);
api.route('/projects/:projectId/llm/country-breakdown', projects_projectId_llm_countryBreakdownRoute);
api.route('/projects/:projectId/llm/metrics', projects_projectId_llm_metricsRoute);
api.route('/projects/:projectId/llm/model-breakdown', projects_projectId_llm_modelBreakdownRoute);
api.route('/projects/:projectId/llm/scores', projects_projectId_llm_scoresRoute);
api.route('/projects/:projectId/llm/series', projects_projectId_llm_seriesRoute);
api.route('/projects/:projectId/llm/template-stats', projects_projectId_llm_templateStatsRoute);
api.route('/projects/:projectId/llm/traces', projects_projectId_llm_tracesRoute);
api.route('/projects/:projectId/llm/user-breakdown', projects_projectId_llm_userBreakdownRoute);
api.route('/projects/:projectId/metrics/batch', projects_projectId_metrics_batchRoute);
api.route('/projects/:projectId/metrics/expanded', projects_projectId_metrics_expandedRoute);
api.route('/projects/:projectId/metrics', projects_projectId_metricsRoute);
api.route('/projects/:projectId/notification-rules', projects_projectId_notificationRulesRoute);
api.route('/projects/:projectId/notifications', projects_projectId_notificationsRoute);
api.route('/projects/:projectId/pageviews', projects_projectId_pageviewsRoute);
api.route('/projects/:projectId/performance', projects_projectId_performanceRoute);
api.route('/projects/:projectId/replays/saved', projects_projectId_replays_savedRoute);
api.route('/projects/:projectId/replays/:sessionId/chunks', projects_projectId_replays_sessionId_chunksRoute);
api.route('/projects/:projectId/replays', projects_projectId_replaysRoute);
api.route('/projects/:projectId/revenue/metrics', projects_projectId_revenue_metricsRoute);
api.route('/projects/:projectId/revenue/sessions', projects_projectId_revenue_sessionsRoute);
api.route('/projects/:projectId/revenue/stats', projects_projectId_revenue_statsRoute);
api.route('/projects/:projectId/revenue/unit-economics', projects_projectId_revenue_unitEconomicsRoute);
api.route('/projects/:projectId/revenue/users', projects_projectId_revenue_usersRoute);
api.route('/projects/:projectId/revenue', projects_projectId_revenueRoute);
api.route('/projects/:projectId/segments/:segmentId', projects_projectId_segments_segmentIdRoute);
api.route('/projects/:projectId/segments', projects_projectId_segmentsRoute);
api.route('/projects/:projectId/session-data/properties', projects_projectId_sessionData_propertiesRoute);
api.route('/projects/:projectId/session-data/values', projects_projectId_sessionData_valuesRoute);
api.route('/projects/:projectId/sessions/stats', projects_projectId_sessions_statsRoute);
api.route('/projects/:projectId/sessions/weekly', projects_projectId_sessions_weeklyRoute);
api.route('/projects/:projectId/sessions/:sessionId/activity', projects_projectId_sessions_sessionId_activityRoute);
api.route('/projects/:projectId/sessions/:sessionId/data', projects_projectId_sessions_sessionId_dataRoute);
api.route('/projects/:projectId/sessions/:sessionId/properties', projects_projectId_sessions_sessionId_propertiesRoute);
api.route('/projects/:projectId/sessions/:sessionId', projects_projectId_sessions_sessionIdRoute);
api.route('/projects/:projectId/sessions', projects_projectId_sessionsRoute);
api.route('/projects/:projectId/stats', projects_projectId_statsRoute);
api.route('/projects/:projectId/transfer', projects_projectId_transferRoute);
api.route('/projects/:projectId/values', projects_projectId_valuesRoute);
api.route('/projects/:projectId/visitors/:visitorId/activity', projects_projectId_visitors_visitorId_activityRoute);
api.route('/projects/:projectId/visitors/:visitorId', projects_projectId_visitors_visitorIdRoute);
api.route('/projects/:projectId/visitors', projects_projectId_visitorsRoute);
api.route('/projects/:projectId', projects_projectIdRoute);
api.route('/projects', projectsRoute);
api.route('/push-subscriptions', pushSubscriptionsRoute);
api.route('/realtime/:projectId', realtime_projectIdRoute);
api.route('/reports/attribution', reports_attributionRoute);
api.route('/reports/breakdown', reports_breakdownRoute);
api.route('/reports/funnel', reports_funnelRoute);
api.route('/reports/goal', reports_goalRoute);
api.route('/reports/journey', reports_journeyRoute);
api.route('/reports/performance', reports_performanceRoute);
api.route('/reports/retention', reports_retentionRoute);
api.route('/reports/revenue', reports_revenueRoute);
api.route('/reports/utm', reports_utmRoute);
api.route('/reports/:id', reports_idRoute);
api.route('/reports', reportsRoute);
api.route('/users/:id/organizations', users_id_organizationsRoute);
api.route('/users/:id/projects', users_id_projectsRoute);
api.route('/users/:id', users_idRoute);
api.route('/users', usersRoute);


app.route('/', api);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
console.log(`Server is running on port ${port}`);

// Only run the node server if we are running natively in Node.js
// Cloudflare Workers should simply use the 'export default app'
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  import('@hono/node-server').then(({ serve }) => {
    serve({
      fetch: app.fetch,
      port
    });
  });
}

export default app;
