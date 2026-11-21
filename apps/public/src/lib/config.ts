export function getDashboardUrl(path = ''): string {
  const envVal =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.NEXT_PUBLIC_DASHBOARD_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DASHBOARD_URL) ||
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_DASHBOARD_URL) ||
    'http://localhost:3000';

  let baseUrl = String(envVal).trim();

  // Fix malformed protocol like "http:localhost:3000" or missing scheme
  if (baseUrl.startsWith('http:') && !baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http:', 'http://');
  } else if (baseUrl.startsWith('https:') && !baseUrl.startsWith('https://')) {
    baseUrl = baseUrl.replace('https:', 'https://');
  } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
      ? `http://${baseUrl}`
      : `https://${baseUrl}`;
  }

  // Remove trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, '');

  if (!path) return baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export const DASHBOARD_URL = getDashboardUrl();

export const DOCS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_DOCS_URL) ||
  'https://docs.visionhq.tech';

export const GITHUB_URL = 'https://github.com/abhirupkumar/vision-oss';

export const SHOW_PAID_PLANS =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_SHOW_PAID_PLANS === 'true') ||
  false;
