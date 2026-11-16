
import {
  buildUnattributedLog,
  getEffectiveVisitorId,
  resolveAttribution,
} from '@/lib/payments/attribution.js';
import { ATTRIBUTION_KEYS } from '@/lib/payments/types.js';

describe('resolveAttribution', () => {
  const full = {
    [ATTRIBUTION_KEYS.PROJECT_ID]: 'proj_abc123',
    [ATTRIBUTION_KEYS.VISITOR_ID]: 'visitor_xyz',
    [ATTRIBUTION_KEYS.DEVICE_ID]: null,
  };

  it('returns ok=true for fully identified attribution', () => {
    const result = resolveAttribution(full);
    expect(result.ok).toBe(true);
    expect(result.projectId).toBe('proj_abc123');
    expect(result.visitorId).toBe('visitor_xyz');
    expect(result.isAnonymous).toBe(false);
    expect(result.missing).toHaveLength(0);
  });

  it('returns ok=true for anonymous attribution (deviceId fallback)', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: 'proj_abc123',
      [ATTRIBUTION_KEYS.VISITOR_ID]: null,
      [ATTRIBUTION_KEYS.DEVICE_ID]: 'device_123',
    });
    expect(result.ok).toBe(true);
    expect(result.isAnonymous).toBe(true);
    expect(result.visitorId).toBeNull();
    expect(result.deviceId).toBe('device_123');
  });

  it('fails when projectId is missing', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: null,
      [ATTRIBUTION_KEYS.VISITOR_ID]: 'visitor_xyz',
      [ATTRIBUTION_KEYS.DEVICE_ID]: null,
    });
    expect(result.ok).toBe(false);
    expect(result.missing.some(m => m.includes('projectId'))).toBe(true);
  });

  it('fails when both visitorId and deviceId are missing', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: 'proj_abc123',
      [ATTRIBUTION_KEYS.VISITOR_ID]: null,
      [ATTRIBUTION_KEYS.DEVICE_ID]: null,
    });
    expect(result.ok).toBe(false);
    expect(result.hasVisitorIdentifier).toBe(false);
    expect(result.missing.some(m => m.includes('visitor'))).toBe(true);
  });

  it('fails when all fields are missing', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: null,
      [ATTRIBUTION_KEYS.VISITOR_ID]: null,
      [ATTRIBUTION_KEYS.DEVICE_ID]: null,
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toHaveLength(2);
  });
});

describe('getEffectiveVisitorId', () => {
  it('returns visitorId when present', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: 'proj_1',
      [ATTRIBUTION_KEYS.VISITOR_ID]: 'visitor_1',
      [ATTRIBUTION_KEYS.DEVICE_ID]: 'device_1',
    });
    expect(getEffectiveVisitorId(result)).toBe('visitor_1');
  });

  it('falls back to deviceId when visitorId is null', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: 'proj_1',
      [ATTRIBUTION_KEYS.VISITOR_ID]: null,
      [ATTRIBUTION_KEYS.DEVICE_ID]: 'device_1',
    });
    expect(getEffectiveVisitorId(result)).toBe('device_1');
  });

  it('returns null when neither is present', () => {
    const result = resolveAttribution({
      [ATTRIBUTION_KEYS.PROJECT_ID]: 'proj_1',
      [ATTRIBUTION_KEYS.VISITOR_ID]: null,
      [ATTRIBUTION_KEYS.DEVICE_ID]: null,
    });
    expect(getEffectiveVisitorId(result)).toBeNull();
  });
});

describe('buildUnattributedLog', () => {
  it('returns a structured log entry', () => {
    const log = buildUnattributedLog('evt_001', 'stripe', ["'projectId' is required"]);
    expect(log.attributed).toBe(false);
    expect(log.providerEventId).toBe('evt_001');
    expect(log.provider).toBe('stripe');
    expect(log.missingFields).toContain("'projectId' is required");
    expect(log.loggedAt).toBeTruthy();
  });
});
