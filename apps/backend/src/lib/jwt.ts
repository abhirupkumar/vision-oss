
// CF Workers-compatible JWT using Web Crypto API (HMAC-SHA256).
// Replaces 'jsonwebtoken' which uses Node.js crypto internals.

import { decrypt, encrypt } from '@/lib/crypto';

const ALG = 'HS256';

function b64UrlEncode(data: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = new Uint8Array(data);
  }
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlDecode(str: string): string {
  const padded = str + '=='.slice(0, (4 - (str.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createToken(payload: any, secret: any, options?: any): Promise<string> {
  const header = b64UrlEncode(JSON.stringify({ alg: ALG, typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claims: any = { ...payload, iat: payload.iat ?? now };

  if (options?.expiresIn) {
    const seconds =
      typeof options.expiresIn === 'number'
        ? options.expiresIn
        : parseDuration(options.expiresIn);
    claims.exp = now + seconds;
  }

  const body = b64UrlEncode(JSON.stringify(claims));
  const signingInput = `${header}.${body}`;

  const key = await getHmacKey(String(secret));
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput),
  );
  const signature = b64UrlEncode(sigBuffer);

  return `${signingInput}.${signature}`;
}

export async function parseToken(token: string, secret: any): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const signingInput = `${header}.${body}`;

    const key = await getHmacKey(String(secret));

    // Convert base64url signature back to ArrayBuffer
    const rawSig = b64UrlDecode(signature);
    const sigBytes = new Uint8Array(rawSig.length);
    for (let i = 0; i < rawSig.length; i++) sigBytes[i] = rawSig.charCodeAt(i);

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(signingInput),
    );
    if (!valid) return null;

    const payload = JSON.parse(b64UrlDecode(body));

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function parseDuration(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 3600;
  const n = parseInt(match[1]);
  const unit = match[2];
  const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * map[unit];
}

export function createSecureToken(payload: any, secret: any, options?: any) {
  // Note: returns a Promise now since createToken is async
  return createToken(payload, secret, options).then(token => encrypt(token, secret));
}

export async function parseSecureToken(token: string, secret: any) {
  try {
    return parseToken(decrypt(token, secret), secret);
  } catch {
    return null;
  }
}

export async function parseAuthToken(req: Request, secret: string) {
  try {
    const token = req.headers.get('authorization')?.split(' ')?.[1];
    return parseSecureToken(token as string, secret);
  } catch {
    return null;
  }
}
