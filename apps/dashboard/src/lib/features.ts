/**
 * Feature flags for Vision:
 * Distinguishes between Vision Cloud (managed SaaS with billing, AI assistant, MCP)
 * and Vision Community Edition (self-hosted open-source).
 *
 * Defaults to true if NEXT_PUBLIC_IS_CLOUD is not explicitly set to 'false'.
 */
export const IS_CLOUD = process.env.NEXT_PUBLIC_IS_CLOUD !== 'false';
export const SHOW_PAID_PLANS = process.env.NEXT_PUBLIC_SHOW_PAID_PLANS !== 'false';
export const HAS_BILLING = IS_CLOUD && SHOW_PAID_PLANS;
export const HAS_AI_ASSISTANT = IS_CLOUD && SHOW_PAID_PLANS;
export const HAS_MCP = IS_CLOUD && SHOW_PAID_PLANS;
export const HAS_ANOMALY_ALERTS = IS_CLOUD && SHOW_PAID_PLANS;
