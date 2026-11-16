import { ATTRIBUTION_KEYS } from '@/lib/payments/types';

/**
 * Attribution result from payment event metadata.
 */
export interface AttributionResult {
  ok: boolean;
  projectId: string | null;
  visitorId: string | null;
  deviceId: string | null;
  /** true when visitor or device id is present */
  hasVisitorIdentifier: boolean;
  /** anonymous when only deviceId is present (no visitorId) */
  isAnonymous: boolean;
  /** reasons attribution failed (empty = fully attributed) */
  missing: string[];
}

/**
 * Validate and extract attribution identifiers from payment event metadata.
 *
 * Contract:
 *   - `projectId`  (required for attribution)
 *   - `visitorid`  (identified user — preferred)
 *   - `deviceid`   (anonymous fallback — used when visitorid is absent)
 *
 * @param metadata - key/value metadata from the provider checkout session
 */
export function resolveAttribution(
  metadata: Record<string, string | undefined | null>,
): AttributionResult {
  const projectId = metadata[ATTRIBUTION_KEYS.PROJECT_ID] ?? null;
  const visitorId = metadata[ATTRIBUTION_KEYS.VISITOR_ID] ?? null;
  const deviceId = metadata[ATTRIBUTION_KEYS.DEVICE_ID] ?? null;

  const missing: string[] = [];

  if (!projectId) {
    missing.push(`'${ATTRIBUTION_KEYS.PROJECT_ID}' is required but was not found in metadata`);
  }

  if (!visitorId && !deviceId) {
    missing.push(
      `A visitor identifier is required: either '${ATTRIBUTION_KEYS.VISITOR_ID}' (identified) or '${ATTRIBUTION_KEYS.DEVICE_ID}' (anonymous)`,
    );
  }

  const hasVisitorIdentifier = !!(visitorId || deviceId);
  const isAnonymous = hasVisitorIdentifier && !visitorId;

  return {
    ok: missing.length === 0,
    projectId,
    visitorId,
    deviceId,
    hasVisitorIdentifier,
    isAnonymous,
    missing,
  };
}

/**
 * Best-effort visitor identifier — prefers identified visitorId, falls back to deviceId.
 */
export function getEffectiveVisitorId(result: AttributionResult): string | null {
  return result.visitorId ?? result.deviceId ?? null;
}

/**
 * Build a structured log entry for unattributed events.
 * These can be surfaced in a debug/admin view later.
 */
export function buildUnattributedLog(
  providerEventId: string,
  provider: string,
  reason: string[],
): {
  providerEventId: string;
  provider: string;
  attributed: false;
  missingFields: string[];
  loggedAt: string;
} {
  return {
    providerEventId,
    provider,
    attributed: false,
    missingFields: reason,
    loggedAt: new Date().toISOString(),
  };
}
