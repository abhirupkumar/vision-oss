// Analytics event/session/visitor data types

export interface SaveEventArgs {
  projectId: string;
  sessionId: string;
  visitorId: string;
  eventType: number;
  createdAt?: Date;

  // Page
  pageTitle?: string;
  hostname?: string;
  urlPath: string;
  urlQuery?: string;
  referrerPath?: string;
  referrerQuery?: string;
  referrerDomain?: string;

  // Session
  distinctId?: string;
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;

  // Events
  eventName?: string;
  eventData?: Record<string, unknown>;
  tag?: string;
  notify?: boolean;
  icon?: string;
  channel?: string;

  // UTM
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Click IDs
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  lifatid?: string;
  twclid?: string;

  // Core Web Vitals
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

export interface SaveRevenueArgs {
  projectId: string;
  visitorId: string;
  eventId: string;
  eventName: string;
  currency: string;
  revenue: number;
  createdAt?: Date;
}

export interface SaveEventDataArgs {
  projectId: string;
  sessionId: string;
  eventId: string;
  urlPath?: string;
  eventName?: string;
  eventData: Record<string, unknown>;
  createdAt?: Date;
}

export interface SessionData {
  id: string;
  projectId: string;
  visitorId: string;
  hostname?: string;
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  distinctId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface VisitorData {
  id: string;
  projectId: string;
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: string | null;
  longitude?: string | null;
  distinctId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  properties?: Record<string, unknown>;
  createdAt?: Date;
}

export interface ProjectStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}
