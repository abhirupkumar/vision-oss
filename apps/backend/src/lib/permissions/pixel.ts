import { hasPermission } from '../auth.js';
import { PERMISSIONS } from '../constants.js';
import type { Auth } from '../types.js';
import { getMember, getPixel } from '@vision/db';

export async function canViewPixel({ user }: Auth, pixelId: string) {
  if (user?.isAdmin) {
    return true;
  }

  const pixel = await getPixel(pixelId);

  if (pixel.userId) {
    return user.id === pixel.userId;
  }

  if (pixel.organizationId) {
    const member = await getMember(pixel.organizationId, user.id);

    return !!member;
  }

  return false;
}

export async function canUpdatePixel({ user }: Auth, pixelId: string) {
  if (user.isAdmin) {
    return true;
  }

  const pixel = await getPixel(pixelId);

  if (pixel.userId) {
    return user.id === pixel.userId;
  }

  if (pixel.organizationId) {
    const member = await getMember(pixel.organizationId, user.id);

    return member && hasPermission(member.role, PERMISSIONS.projectUpdate);
  }

  return false;
}

export async function canDeletePixel({ user }: Auth, pixelId: string) {
  if (user.isAdmin) {
    return true;
  }

  const pixel = await getPixel(pixelId);

  if (pixel.userId) {
    return user.id === pixel.userId;
  }

  if (pixel.organizationId) {
    const member = await getMember(pixel.organizationId, user.id);

    return member && hasPermission(member.role, PERMISSIONS.projectDelete);
  }

  return false;
}
