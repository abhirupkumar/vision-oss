import debug from 'debug';
import { PERMISSIONS, ROLE_PERMISSIONS, SHARE_TOKEN_HEADER } from './constants.js';
import { secret } from './crypto';
import { getRandomChars } from './generate.js';
import { createSecureToken, parseToken } from './jwt.js';
import redis from './redis';

const log = debug('vision:auth');

export function getBearerToken(request: Request) {
  const auth = request.headers.get('authorization');
  return auth?.split(' ')[1];
}

export function parseShareToken(request: Request) {
  try {
    const headerVal = request.headers.get(SHARE_TOKEN_HEADER) || request.headers.get('x-sigma-share-token') || '';
    return parseToken(headerVal, secret());
  } catch (e) {
    log(e);
    return null;
  }
}

export async function saveAuth(data: any, expire = 0) {
  const authKey = `auth:${getRandomChars(32)}`;

  return createSecureToken({ authKey }, secret());
}

export async function hasPermission(role: string, permission: string | string[]) {
  const ensureArray = (p: string | string[]) => Array.isArray(p) ? p : [p];
  return ensureArray(permission).some(
    e =>
      (
        ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] as readonly string[] | undefined
      )?.includes(e) ||
      (
        ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] as readonly string[] | undefined
      )?.includes(PERMISSIONS.all),
  );
}
