import { hasPermission } from '../auth.js';
import { PERMISSIONS } from '../constants.js';
import type { Auth } from '../types.js';
import { getMember } from '@vision/db';

export async function canViewOrganization({ user }: Auth, organizationId: string) {
  if (user.isAdmin) {
    return true;
  }

  return getMember(organizationId, user.id);
}

export async function canCreateOrganization({ user }: Auth) {
  if (user.isAdmin) {
    return true;
  }

  return !!user;
}

export async function canUpdateOrganization({ user }: Auth, organizationId: string) {
  if (user.isAdmin) {
    return true;
  }

  const member = await getMember(organizationId, user.id);

  return !!(
    member &&
    (member.role === 'owner' ||
      member.role === 'admin' ||
      (await hasPermission(member.role, PERMISSIONS.organizationUpdate)))
  );
}

export async function canDeleteOrganization({ user }: Auth, organizationId: string) {
  if (user.isAdmin) {
    return true;
  }

  const member = await getMember(organizationId, user.id);

  return !!(
    member &&
    (member.role === 'owner' ||
      (await hasPermission(member.role, PERMISSIONS.organizationDelete)))
  );
}

export async function canDeleteMember(
  { user }: Auth,
  organizationId: string,
  removeUserId: string,
) {
  if (user.isAdmin) {
    return true;
  }

  if (removeUserId === user.id) {
    return true;
  }

  const member = await getMember(organizationId, user.id);

  return !!(
    member &&
    (member.role === 'owner' ||
      member.role === 'admin' ||
      (await hasPermission(member.role, PERMISSIONS.organizationUpdate)))
  );
}

export async function canCreateOrganizationProject({ user }: Auth, organizationId: string) {
  if (user.isAdmin) {
    return true;
  }

  const member = await getMember(organizationId, user.id);

  return member && hasPermission(member.role, PERMISSIONS.projectCreate);
}

export async function canViewAllOrganizations({ user }: Auth) {
  return user.isAdmin;
}
