import { hasPermission } from '../auth.js';
import { PERMISSIONS } from '../constants.js';
import type { Auth } from '../types.js';
import { getLink, getMember } from '@vision/db';

export async function canViewLink({ user }: Auth, linkId: string) {
  if (user?.isAdmin) {
    return true;
  }

  const link = await getLink(linkId);

  if (link.userId) {
    return user.id === link.userId;
  }

  if (link.organizationId) {
    const member = await getMember(link.organizationId, user.id);

    return !!member;
  }

  return false;
}

export async function canUpdateLink({ user }: Auth, linkId: string) {
  if (user.isAdmin) {
    return true;
  }

  const link = await getLink(linkId);

  if (link.userId) {
    return user.id === link.userId;
  }

  if (link.organizationId) {
    const member = await getMember(link.organizationId, user.id);

    return member && hasPermission(member.role, PERMISSIONS.projectUpdate);
  }

  return false;
}

export async function canDeleteLink({ user }: Auth, linkId: string) {
  if (user.isAdmin) {
    return true;
  }

  const link = await getLink(linkId);

  if (link.userId) {
    return user.id === link.userId;
  }

  if (link.organizationId) {
    const member = await getMember(link.organizationId, user.id);

    return member && hasPermission(member.role, PERMISSIONS.projectDelete);
  }

  return false;
}
