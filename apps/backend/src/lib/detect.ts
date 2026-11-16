
import { browserName, detectOS } from 'detect-browser';
import ipaddr from 'ipaddr.js';
import { UAParser } from 'ua-parser-js';
import { getIpAddress, stripPort } from './ip.js';
import { safeDecodeURIComponent } from './url.js';

const LOCALHOST_RANGES = [
  '127.0.0.1',
  '::1',
  'localhost',
];

// Pure CF-Workers-compatible localhost check (no Node.js dns module)
function isLocalhostIp(ip: string): boolean {
  if (!ip) return false;
  const stripped = stripPort(ip).toLowerCase().replace(/^\[|\]$/g, '');
  return (
    LOCALHOST_RANGES.includes(stripped) ||
    stripped.startsWith('127.') ||
    stripped === '::1' ||
    stripped === '0:0:0:0:0:0:0:1'
  );
}

const PROVIDER_HEADERS = [
  // Cloudflare headers
  {
    countryHeader: 'cf-ipcountry',
    regionHeader: 'cf-region-code',
    cityHeader: 'cf-ipcity',
    latitudeHeader: 'cf-iplatitude',
    longitudeHeader: 'cf-iplongitude',
  },
  // Vercel headers
  {
    countryHeader: 'x-vercel-ip-country',
    regionHeader: 'x-vercel-ip-country-region',
    cityHeader: 'x-vercel-ip-city',
    latitudeHeader: 'x-vercel-ip-latitude',
    longitudeHeader: 'x-vercel-ip-longitude',
  },
  // CloudFront headers
  {
    countryHeader: 'cloudfront-viewer-country',
    regionHeader: 'cloudfront-viewer-country-region',
    cityHeader: 'cloudfront-viewer-city',
    latitudeHeader: 'cloudfront-viewer-latitude',
    longitudeHeader: 'cloudfront-viewer-longitude',
  },
];

export function getDevice(userAgent: string, screen: string = '') {
  const { device } = UAParser(userAgent);

  const [width] = screen.split('x');

  const type = device?.type || 'desktop';

  if (type === 'desktop' && screen && +width <= 1920) {
    return 'laptop';
  }

  return type;
}

function getRegionCode(country: string, region: string) {
  if (!country || !region) {
    return undefined;
  }

  return region.includes('-') ? region : `${country}-${region}`;
}

function decodeHeader(s: string | undefined | null): string | undefined | null {
  if (s === undefined || s === null) {
    return s;
  }

  return Buffer.from(s, 'latin1').toString('utf-8');
}

export async function getLocation(ip: string = '', request: Request, hasPayloadIP: boolean) {
  // Ignore local ips
  if (!ip || isLocalhostIp(ip)) {
    return null;
  }

  if (!hasPayloadIP && !process.env.SKIP_LOCATION_HEADERS) {
    const cf = (request as any).cf;
    if (cf && cf.country) {
      return {
        country: cf.country,
        region: getRegionCode(cf.country, cf.regionCode || cf.region),
        city: cf.city,
        latitude: cf.latitude ? parseFloat(cf.latitude) : null,
        longitude: cf.longitude ? parseFloat(cf.longitude) : null,
      };
    }

    const headers = request.headers;
    for (const provider of PROVIDER_HEADERS) {
      const countryHeader = headers.get(provider.countryHeader);
      if (countryHeader) {
        const country = decodeHeader(countryHeader);
        const region = decodeHeader(headers.get(provider.regionHeader));
        const city = decodeHeader(headers.get(provider.cityHeader));
        const latitudeHeader = headers.get(provider.latitudeHeader);
        const longitudeHeader = headers.get(provider.longitudeHeader);
        const latitude = latitudeHeader ? parseFloat(latitudeHeader) : null;
        const longitude = longitudeHeader ? parseFloat(longitudeHeader) : null;

        return {
          country,
          region: getRegionCode(country, region),
          city,
          latitude,
          longitude,
        };
      }
    }
  }

  // Fallback if headers don't exist
  return null;
}

export async function getClientInfo(request: Request, payload: Record<string, any>) {
  const userAgent = payload?.userAgent || request.headers.get('user-agent');
  const ip = payload?.ip || getIpAddress(request.headers);
  const location = await getLocation(ip, request, !!payload?.ip);
  const country = safeDecodeURIComponent(location?.country);
  const region = safeDecodeURIComponent(location?.region);
  const city = safeDecodeURIComponent(location?.city);
  const browser = payload?.browser ?? browserName(userAgent);
  const os = payload?.os ?? (detectOS(userAgent) as string);
  const device = payload?.device ?? getDevice(userAgent, payload?.screen);
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  return { userAgent, browser, os, ip, country, region, city, device, latitude, longitude };
}

export function hasBlockedIp(clientIp: string) {
  const ignoreIps = process.env.IGNORE_IP;

  if (ignoreIps) {
    const ips = [];

    if (ignoreIps) {
      ips.push(...ignoreIps.split(',').map(n => n.trim()));
    }

    return ips.find(ip => {
      if (ip === clientIp) {
        return true;
      }

      // CIDR notation
      if (ip.indexOf('/') > 0) {
        const addr = ipaddr.parse(clientIp);
        const range = ipaddr.parseCIDR(ip);

        if (addr.kind() === range[0].kind() && addr.match(range)) {
          return true;
        }
      }

      return false;
    });
  }

  return false;
}
