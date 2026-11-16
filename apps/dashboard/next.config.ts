import 'dotenv/config';
import pkg from './package.json' with { type: 'json' };

const TRACKER_SCRIPT = '/script.js';

const basePath = process.env.BASE_PATH || '';
const cloudMode = process.env.CLOUD_MODE || '';
const cloudUrl = process.env.CLOUD_URL || '';
const collectApiEndpoint = process.env.COLLECT_API_ENDPOINT || '';
const corsMaxAge = process.env.CORS_MAX_AGE || '';
const defaultLocale = process.env.DEFAULT_LOCALE || '';
const forceSSL = process.env.FORCE_SSL || '';
const frameAncestors = process.env.ALLOWED_FRAME_URLS || '';
const trackerScriptName = process.env.TRACKER_SCRIPT_NAME || '';
const trackerScriptURL = process.env.TRACKER_SCRIPT_URL || '';
const collectReplayEndpoint = process.env.COLLECT_REPLAY_ENDPOINT || '/record';

const contentSecurityPolicy = `
  default-src 'self' http: https:;
  img-src 'self' https: http: data: blob:;
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.vision-analytics.app https://*.clerk.com;
  connect-src 'self' https: http: ws: wss:;
  style-src 'self' 'unsafe-inline' https: http:;
  font-src 'self' data: https: http:;
  frame-ancestors 'self' ${frameAncestors};
`;

const defaultHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // {
  //   key: 'Content-Security-Policy',
  //   value: contentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  // },
];

if (forceSSL) {
  defaultHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const trackerHeaders = [
  // {
  //   key: 'Access-Control-Allow-Origin',
  //   value: '*',
  // },
  {
    key: 'Cache-Control',
    value: 'public, max-age=86400, must-revalidate',
  },
];

const apiHeaders = [
  // {
  //   key: 'Access-Control-Allow-Origin',
  //   value: '*',
  // },
  {
    key: 'Access-Control-Allow-Headers',
    value: '*',
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, DELETE, POST, PUT',
  },
  {
    key: 'Access-Control-Max-Age',
    value: corsMaxAge || '86400',
  },
  {
    key: 'Cache-Control',
    value: 'no-cache',
  },
];

const headers = [
  {
    source: '/api/:path*',
    headers: apiHeaders,
  },
  {
    source: '/:path*',
    headers: defaultHeaders,
  },
  {
    source: TRACKER_SCRIPT,
    headers: trackerHeaders,
  },
];

const rewrites = [];

if (trackerScriptURL) {
  rewrites.push({
    source: TRACKER_SCRIPT,
    destination: trackerScriptURL,
  });
}

if (collectApiEndpoint || true) { // Always add default if not specified
  const apiEndpoint = collectApiEndpoint || '/send';
  headers.push({
    source: apiEndpoint,
    headers: apiHeaders,
  });

  rewrites.push({
    source: apiEndpoint,
    destination: '/api/send',
  });
}

if (collectReplayEndpoint || true) {
  const replayEndpoint = collectReplayEndpoint || '/record';
  headers.push({
    source: replayEndpoint,
    headers: apiHeaders,
  });

  rewrites.push({
    source: replayEndpoint,
    destination: '/api/record',
  });
}

headers.push({
  source: '/api/:path*',
  headers: apiHeaders,
});

const redirects = [
  {
    source: '/settings',
    destination: '/settings/preferences',
    permanent: false,
  },
  {
    source: '/teams/:id',
    destination: '/teams/:id/projects',
    permanent: false,
  },
  {
    source: '/teams/:id/settings',
    destination: '/teams/:id/settings/preferences',
    permanent: false,
  },
  {
    source: '/admin',
    destination: '/admin/users',
    permanent: false,
  },
];

// Adding rewrites + headers for all alternative tracker script names.
if (trackerScriptName) {
  const names = trackerScriptName?.split(',').map(name => name.trim());

  if (names) {
    names.forEach(name => {
      const normalizedSource = `/${name.replace(/^\/+/, '')}`;

      rewrites.push({
        source: normalizedSource,
        destination: TRACKER_SCRIPT,
      });

      headers.push({
        source: normalizedSource,
        headers: trackerHeaders,
      });
    });
  }
}

if (cloudMode) {
  rewrites.push({
    source: '/script.js',
    destination: 'https://cloud.umami.is/script.js',
  });
}

const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@vision/db', '@vision/shared-types'],
  env: {
    basePath,
    cloudMode,
    cloudUrl,
    currentVersion: pkg.version,
    defaultLocale,
  },
  basePath,
  serverExternalPackages: [
    '@tinybirdco/sdk',
    'pg',
    'pg-connection-string',
    'pgpass',
    '@redis/client',
    'kafkajs',
    '@prisma/client',
  ],
  // output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return headers;
  },
  async rewrites() {
    return [
      ...rewrites,
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/:path*`,
      },
      {
        source: '/telemetry.js',
        destination: '/api/scripts/telemetry',
      },
      {
        source: '/teams/:teamId/:path*',
        destination: '/:path*',
      },
    ];
  },
  async redirects() {
    return [...redirects];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx|mjs)$/,
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },
};

import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
