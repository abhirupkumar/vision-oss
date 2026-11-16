export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_RESET_DATE = '2000-01-01';

export const OPERATORS = {
  equals: 'eq',
  notEquals: 'neq',
  contains: 'contains',
  doesNotContain: 'doesNotContain',
};

export const FILTER_COLUMNS: Record<string, string> = {
  url: 'url_path',
  referrer: 'referrer_domain',
  title: 'page_title',
  query: 'url_query',
  host: 'hostname',
  os: 'os',
  browser: 'browser',
  device: 'device',
  country: 'country',
  region: 'region',
  city: 'city',
  language: 'language',
  event: 'event_name',
  tag: 'tag',
  eventType: 'event_type',
  errorType: 'error_type',
  errorMessage: 'message',
  fingerprint: 'fingerprint',
  sessionId: 'session_id',
  visitorId: 'visitor_id',
  path: 'url_path',
  entry: 'url_path',
  exit: 'url_path',
  domain: 'referrer_domain',
  hostname: 'hostname',
  visitorId_raw: 'visitor_id',
};

export const EVENT_COLUMNS = [
  'path',
  'entry',
  'exit',
  'referrer',
  'domain',
  'title',
  'query',
  'event',
  'tag',
  'hostname',
  'visitorId',
];

export const SESSION_COLUMNS = [
  'browser',
  'os',
  'device',
  'screen',
  'language',
  'country',
  'city',
  'region',
];

export const EVENT_TYPE = {
  pageView: 1,
  customEvent: 2,
  linkEvent: 3,
  pixelEvent: 4,
  performance: 5,
  error: 6,
} as const;

export const DATA_TYPE = {
  string: 1,
  number: 2,
  boolean: 3,
  date: 4,
  array: 5,
} as const;

export const DATETIME_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3}(Z|\+[0-9]{2}:[0-9]{2})?)?$/;

export const SOCIAL_DOMAINS = [
  'bsky.app',
  'facebook.com',
  'fb.com',
  'ig.com',
  'instagram.com',
  'linkedin.',
  'news.ycombinator.com',
  'pinterest.',
  'reddit.',
  'snapchat.',
  't.co',
  'threads.net',
  'tiktok.',
  'twitter.com',
  'x.com',
];

export const SEARCH_DOMAINS = [
  'baidu.com',
  'bing.com',
  'chatgpt.com',
  'duckduckgo.com',
  'ecosia.org',
  'google.',
  'msn.com',
  'perplexity.ai',
  'search.brave.com',
  'yandex.',
];

export const SHOPPING_DOMAINS = [
  'alibaba.com',
  'aliexpress.com',
  'amazon.',
  'bestbuy.com',
  'ebay.com',
  'etsy.com',
  'newegg.com',
  'target.com',
  'walmart.com',
];

export const EMAIL_DOMAINS = [
  'gmail.',
  'hotmail.',
  'mail.yahoo.',
  'outlook.',
  'proton.me',
  'protonmail.',
];

export const VIDEO_DOMAINS = ['twitch.', 'youtube.'];

export const PAID_AD_PARAMS = [
  'ad_id=',
  'aid=',
  'dclid=',
  'epik=',
  'fbclid=',
  'gclid=',
  'li_fat_id=',
  'msclkid=',
  'ob_click_id=',
  'pc_id=',
  'rdt_cid=',
  'scid=',
  'ttclid=',
  'twclid=',
  'utm_medium=cpc',
  'utm_medium=paid',
  'utm_medium=paid_social',
  'utm_source=google',
];

export const GROUPED_DOMAINS = [
  { name: 'Baidu', domain: 'baidu.com', match: 'baidu.' },
  { name: 'Bing', domain: 'bing.com', match: 'bing.' },
  { name: 'Brave', domain: 'brave.com', match: 'brave.' },
  { name: 'ChatGPT', domain: 'chatgpt.com', match: 'chatgpt.' },
  { name: 'DuckDuckGo', domain: 'duckduckgo.com', match: 'duckduckgo.' },
  { name: 'Facebook', domain: 'facebook.com', match: 'facebook.' },
  { name: 'GitHub', domain: 'github.com', match: 'github.' },
  { name: 'Google', domain: 'google.com', match: 'google.' },
  { name: 'Hacker News', domain: 'news.ycombinator.com', match: 'news.ycombinator.com' },
  { name: 'Instagram', domain: 'instagram.com', match: ['instagram.', 'ig.com'] },
  { name: 'LinkedIn', domain: 'linkedin.com', match: 'linkedin.' },
  { name: 'Pinterest', domain: 'pinterest.com', match: 'pinterest.' },
  { name: 'Reddit', domain: 'reddit.com', match: 'reddit.' },
  { name: 'Snapchat', domain: 'snapchat.com', match: 'snapchat.' },
  { name: 'Twitter', domain: 'twitter.com', match: ['twitter.', 't.co', 'x.com'] },
  { name: 'Yahoo', domain: 'yahoo.com', match: 'yahoo.' },
  { name: 'Yandex', domain: 'yandex.ru', match: 'yandex.' },
];
