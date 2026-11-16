import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { isBot } from '@/lib/bots/index.js';
import { hash, secret, uuid } from '@/lib/crypto';
import { getClientInfo, hasBlockedIp } from '@/lib/detect.js';
import { dispatchNotifications } from '@/lib/integrations/dispatch.js';
import { createToken, parseToken } from '@/lib/jwt.js';
import { fetchProject } from '@/lib/load.js';
import { safeDecodeURI, safeDecodeURIComponent } from '@/lib/url.js';
import { saveVisitorData, saveEvent, transferVisitorEvents, isOrganizationLocked, isProjectLocked, getLink, getPixel } from '@vision/db';

interface Cache {
  projectId: string;
  visitorId: string;
  sessionId: string;
  iat: number;
}

const app = new Hono();

const schema = z.object({
  type: z.enum(['event', 'identify', 'performance']),
  payload: z
    .object({
      project: z.string().optional(),
      link: z.string().uuid().optional(),
      pixel: z.string().uuid().optional(),
      data: z.any().optional(),
      hostname: z.string().max(100).optional(),
      language: z.string().max(35).optional(),
      referrer: z.string().optional(),
      screen: z.string().max(11).optional(),
      title: z.string().optional(),
      url: z.string().optional(),
      name: z.string().max(50).optional(),
      tag: z.string().max(50).optional(),
      ip: z.string().optional(),
      userAgent: z.string().optional(),
      timestamp: z.coerce.number().int().optional(),
      id: z.string().optional(),
      anonId: z.string().optional(),
      browser: z.string().optional(),
      os: z.string().optional(),
      device: z.string().optional(),
      lcp: z.coerce.number().optional(),
      inp: z.coerce.number().optional(),
      cls: z.coerce.number().optional(),
      fcp: z.coerce.number().optional(),
      ttfb: z.coerce.number().optional(),
      // Profile fields (used on identify calls)
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      avatar: z.string().max(2000).optional(),
      properties: z.any().optional(),
    })
    .refine(
      data => {
        const keys = [data.project, data.link, data.pixel];
        const count = keys.filter(Boolean).length;
        return count === 1;
      },
      {
        message: 'Exactly one of project, link, or pixel must be provided',
        path: ['project'],
      },
    ),
});

function startOfHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function serializeError(err: any) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

app.post('/', zValidator('json', schema), async (c) => {
  try {
    const { type, payload } = c.req.valid('json');

    const {
      project: projectId,
      pixel: pixelId,
      link: linkId,
      hostname,
      screen,
      language,
      url,
      referrer,
      name,
      data,
      title,
      tag,
      timestamp,
      id,
      anonId,
      lcp,
      inp,
      cls,
      fcp,
      ttfb,
      firstName,
      lastName,
      email,
      avatar,
      properties: profileProperties,
    } = payload;

    const effectiveId = id || (typeof data === 'object' && data ? data.id : undefined);
    const effectiveEmail = email || (typeof data === 'object' && data ? data.email : undefined);
    const effectiveFirstName = firstName || (typeof data === 'object' && data ? (data.firstName || data.name) : undefined);
    const effectiveLastName = lastName || (typeof data === 'object' && data ? data.lastName : undefined);
    const effectiveAvatar = avatar || (typeof data === 'object' && data ? data.avatar : undefined);
    const effectiveProperties = profileProperties || (typeof data === 'object' && data ? data.properties : undefined);

    const sourceId = projectId || pixelId || linkId;
    if (!sourceId) {
      return c.json({ error: 'Missing identifier' }, 400);
    }

    if (linkId) {
      const link = await getLink(linkId);
      if (link?.organizationId) {
        const locked = await isOrganizationLocked(link.organizationId);
        if (locked) {
          return c.json({ disabled: true, reason: 'No active plan or subscription expired, cancelled, or exhausted' });
        }
      }
    }

    if (pixelId) {
      const pixel = await getPixel(pixelId);
      if (pixel?.organizationId) {
        const locked = await isOrganizationLocked(pixel.organizationId);
        if (locked) {
          return c.json({ disabled: true, reason: 'No active plan or subscription expired, cancelled, or exhausted' });
        }
      }
    }

    // Cache check
    let cache: Cache | null = null;

    if (projectId) {
      const cacheHeader = c.req.header('x-vision-cache') || c.req.header('x-sigma-cache');

      if (cacheHeader) {
        const result = await parseToken(cacheHeader, secret()) as Cache | null;

        if (result) {
          cache = result;
        }
      }

      // Find project
      const project = await fetchProject(projectId);
      if (!project) {
        return c.json({ message: 'Project not found.' }, 400);
      }
      (c as any).project = project;

      const locked = project.organizationId
        ? await isOrganizationLocked(project.organizationId)
        : await isProjectLocked(project.id);

      if (locked) {
        return c.json({ disabled: true, reason: 'No active plan or subscription expired, cancelled, or exhausted' });
      }
    }

    // Client info
    const { ip, userAgent, device, browser, os, country, region, city, latitude, longitude } =
      await getClientInfo(c.req.raw, payload);

    // Bot check
    if (!process.env.DISABLE_BOT_CHECK) {
      const botResult = await isBot(userAgent || '');
      if (botResult) {
        return c.json({ beep: 'boop', bot: botResult.name, type: botResult.type });
      }
    }

    // IP block
    if (hasBlockedIp(ip)) {
      return c.json({ message: 'Forbidden' }, 403);
    }

    const createdAt = timestamp ? new Date(timestamp * 1000) : new Date();
    const now = Math.floor(Date.now() / 1000);

    const visitorSalt = hash(startOfMonth(createdAt).toUTCString());
    const sessionSalt = hash(startOfHour(createdAt).toUTCString());

    const visitorId = effectiveId ? uuid(sourceId, effectiveId) : uuid(sourceId, ip, userAgent, visitorSalt);


    // Session info
    let sessionId = cache?.sessionId || uuid(visitorId, sessionSalt);
    let iat = cache?.iat || now;

    // Expire session after 30 minutes
    if (!timestamp && now - iat > 1800) {
      sessionId = uuid(visitorId, sessionSalt);
      iat = now;
    }

    if (type === 'event') {
      const base = hostname ? `https://${hostname}` : 'https://localhost';
      const currentUrl = new URL(url || '', base);

      let urlPath =
        currentUrl.pathname === '/undefined' ? '' : currentUrl.pathname + currentUrl.hash;
      const urlQuery = currentUrl.search.substring(1);
      const urlDomain = currentUrl.hostname.replace(/^www./, '');

      let referrerPath = '';
      let referrerQuery = '';
      let referrerDomain = '';

      // UTM Params
      const utmSource = currentUrl.searchParams.get('utm_source') || undefined;
      const utmMedium = currentUrl.searchParams.get('utm_medium') || undefined;
      const utmCampaign = currentUrl.searchParams.get('utm_campaign') || undefined;
      const utmContent = currentUrl.searchParams.get('utm_content') || undefined;
      const utmTerm = currentUrl.searchParams.get('utm_term') || undefined;

      // Click IDs
      const gclid = currentUrl.searchParams.get('gclid') || undefined;
      const fbclid = currentUrl.searchParams.get('fbclid') || undefined;
      const msclkid = currentUrl.searchParams.get('msclkid') || undefined;
      const ttclid = currentUrl.searchParams.get('ttclid') || undefined;
      const lifatid = currentUrl.searchParams.get('li_fat_id') || undefined;
      const twclid = currentUrl.searchParams.get('twclid') || undefined;

      if (process.env.REMOVE_TRAILING_SLASH) {
        urlPath = urlPath.replace(/\/(?=(#.*)?$)/, '');
      }

      if (referrer) {
        const referrerUrl = new URL(referrer, base);

        referrerPath = referrerUrl.pathname;
        referrerQuery = referrerUrl.search.substring(1);
        referrerDomain = referrerUrl.hostname.replace(/^www\./, '');
      }

      const eventType = linkId
        ? 3 // linkEvent
        : pixelId
          ? 4 // pixelEvent
          : name
            ? 2 // customEvent
            : 1; // pageView

      const project = (c as any).project || (projectId ? await fetchProject(projectId) : null);

      await saveEvent({
        projectId: sourceId,
        visitorId,
        sessionId,
        eventType,
        createdAt,

        // Page
        pageTitle: safeDecodeURIComponent(title) || undefined,
        hostname: hostname || urlDomain,
        urlPath: safeDecodeURI(urlPath) || '',
        urlQuery: urlQuery || undefined,
        referrerPath: safeDecodeURI(referrerPath) || undefined,
        referrerQuery: referrerQuery || undefined,
        referrerDomain: referrerDomain || undefined,

        // Session
        distinctId: id,
        browser,
        os,
        device,
        screen: screen || undefined,
        language: language || undefined,
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        latitude,
        longitude,

        // Events
        eventName: name || undefined,
        eventData: data,
        tag: tag || undefined,

        // UTM
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,

        // Click IDs
        gclid,
        fbclid,
        msclkid,
        ttclid,
        lifatid,
        twclid,

        // Performance
        lcp,
        inp,
        cls,
        fcp,
        ttfb,
      });

      // Fire notifications asynchronously
      dispatchNotifications(sourceId, payload);
    } else if (type === 'identify') {
      // 1. Identity Stitching: Transfer pre-login anonymous events to identified visitor
      const fromVisitorId = anonId || (cache?.visitorId && cache.visitorId !== visitorId ? cache.visitorId : undefined);
      if (fromVisitorId && fromVisitorId !== visitorId) {
        await transferVisitorEvents({
          projectId: sourceId,
          fromVisitorId,
          toVisitorId: visitorId,
          distinctId: effectiveId,
        });
      }

      // 2. Save all visitor profile data & custom traits to analytics storage (visitor_data)
      const combinedVisitorData: Record<string, any> = {
        ...(typeof data === 'object' && data ? data : {}),
        ...(effectiveFirstName ? { first_name: effectiveFirstName } : {}),
        ...(effectiveLastName ? { last_name: effectiveLastName } : {}),
        ...(effectiveEmail ? { email: effectiveEmail } : {}),
        ...(effectiveAvatar ? { avatar: effectiveAvatar } : {}),
        ...(typeof effectiveProperties === 'object' && effectiveProperties ? effectiveProperties : {}),
      };

      if (Object.keys(combinedVisitorData).length > 0) {
        await saveVisitorData({
          projectId: sourceId,
          visitorId,
          visitorData: combinedVisitorData,
          distinctId: effectiveId,
          createdAt,
        });
      }

      // 4. Record an identify event so the visitor profile always has an activity timeline entry
      const identifyBase = hostname ? `https://${hostname}` : 'https://localhost';
      const identifyUrl = new URL(url || '', identifyBase);
      const identifyPath = identifyUrl.pathname === '/undefined' ? '' : identifyUrl.pathname + identifyUrl.hash;

      await saveEvent({
        projectId: sourceId,
        visitorId,
        sessionId,
        eventType: 2, // Custom event
        eventName: '$identify',
        eventData: data,
        createdAt,
        urlPath: safeDecodeURI(identifyPath) || '',
        hostname: hostname || identifyUrl.hostname.replace(/^www\./, ''),
        distinctId: effectiveId,
        browser,
        os,
        device,
        screen,
        language,
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        latitude,
        longitude,
      });
    } else if (type === 'performance') {
      const base = hostname ? `https://${hostname}` : 'https://localhost';
      const currentUrl = new URL(url || '', base);

      const urlPath =
        currentUrl.pathname === '/undefined' ? '' : currentUrl.pathname + currentUrl.hash;
      const urlQuery = currentUrl.search.substring(1);
      const urlDomain = currentUrl.hostname.replace(/^www./, '');

      let referrerPath = '';
      let referrerQuery = '';
      let referrerDomain = '';

      if (referrer) {
        const referrerUrl = new URL(referrer, base);

        referrerPath = referrerUrl.pathname;
        referrerQuery = referrerUrl.search.substring(1);
        referrerDomain = referrerUrl.hostname.replace(/^www\./, '');
      }

      await saveEvent({
        projectId: sourceId,
        visitorId,
        sessionId,
        eventType: 5, // Performance event type
        createdAt,

        // Page
        pageTitle: safeDecodeURIComponent(title) || undefined,
        hostname: hostname || urlDomain,
        urlPath: safeDecodeURI(urlPath) || '',
        urlQuery: urlQuery || undefined,
        referrerPath: safeDecodeURI(referrerPath) || undefined,
        referrerQuery: referrerQuery || undefined,
        referrerDomain: referrerDomain || undefined,

        // Session
        distinctId: id,
        browser,
        os,
        device,
        screen: screen || undefined,
        language: language || undefined,
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        latitude,
        longitude,

        // Performance
        lcp,
        inp,
        cls,
        fcp,
        ttfb,
      });
    }

    const token = await createToken({ projectId: sourceId, visitorId, sessionId, iat }, secret());

    return c.json({ cache: token, visitorId, sessionId });
  } catch (e) {
    const error = serializeError(e);
    console.error(error);
    return c.json({ error: 'Server error', details: error }, 500);
  }
});

export default app;
