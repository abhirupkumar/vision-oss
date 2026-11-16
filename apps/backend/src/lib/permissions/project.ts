import { hasPermission } from '../auth.js';
import { PERMISSIONS } from '../constants.js';
import type { Auth } from '../types.js';
import {
  getLink,
  getMember,
  getPixel,
  getProject,
  getProjectAccess,
  getProjectAccessByUser,
  isOrganizationLocked,
} from '@vision/db';

export async function canViewProject({ user, shareToken }: Auth, projectId: string) {
  const project = await getProject(projectId);

  if (!project) {
    return false;
  }

  if (user?.isAdmin) {
    return true;
  }

  if (shareToken?.projectId === project.id) {
    return true;
  }

  // Fetch all permission-related data in parallel to minimize DB round trips.
  // Sequential awaits here would add ~50-100ms per hop through Hyperdrive.
  const [projectAccess, member, restrictedAccess] = await Promise.all([
    user ? getProjectAccess(project.id, user.id) : Promise.resolve(null),
    project.organizationId && user ? getMember(project.organizationId, user.id) : Promise.resolve(null),
    project.organizationId && user ? getProjectAccessByUser(user.id, project.organizationId) : Promise.resolve([] as any[]),
  ]);

  if (user) {
    // Check fine-grained RBAC
    if (projectAccess && ['read', 'write', 'admin'].includes(projectAccess.level)) {
      return true;
    }
  }

  if (project.userId) {
    return user.id === project.userId;
  }

  if (project.organizationId) {
    if (!member) {
      return false;
    }

    if (member.role === 'admin') {
      return true;
    }

    if (restrictedAccess.length === 0) {
      return true;
    }

    return !!projectAccess;
  }

  return false;
}

export async function canViewAllProjects({ user }: Auth) {
  return user.isAdmin;
}

export async function canCreateProject({ user }: Auth) {
  if (user.isAdmin) {
    return true;
  }

  return hasPermission(user.role, PERMISSIONS.projectCreate);
}

export async function canUpdateProject({ user }: Auth, projectId: string) {
  if (user.isAdmin) {
    return true;
  }

  const project = await getProject(projectId);

  if (!project) {
    return false;
  }

  // Fetch permission records in parallel
  const [projectAccess, member, restrictedAccess] = await Promise.all([
    user ? getProjectAccess(project.id, user.id) : Promise.resolve(null),
    project.organizationId && user ? getMember(project.organizationId, user.id) : Promise.resolve(null),
    project.organizationId && user ? getProjectAccessByUser(user.id, project.organizationId) : Promise.resolve([] as any[]),
  ]);

  if (user) {
    if (projectAccess && ['write', 'admin'].includes(projectAccess.level)) {
      return true;
    }
  }

  if (project.userId) {
    return user.id === project.userId;
  }

  if (project.organizationId) {
    if (!member || !hasPermission(member.role, PERMISSIONS.projectUpdate)) {
      return false;
    }

    if (member.role === 'admin') {
      return true;
    }

    if (restrictedAccess.length === 0) {
      return true;
    }

    return projectAccess && ['write', 'admin'].includes(projectAccess.level);
  }

  return false;
}

export async function canDeleteProject({ user }: Auth, projectId: string) {
  if (user.isAdmin) {
    return true;
  }

  const project = await getProject(projectId);

  if (!project) {
    return false;
  }

  if (user) {
    // Check fine-grained OpenPanel-level RBAC first
    const access = await getProjectAccess(project.id, user.id);
    if (access && access.level === 'admin') {
      return true;
    }
  }

  if (project.userId) {
    return user.id === project.userId;
  }

  if (project.organizationId) {
    const member = await getMember(project.organizationId, user.id);
    if (!member || !hasPermission(member.role, PERMISSIONS.projectDelete)) {
      return false;
    }

    if (member.role === 'admin') {
      return true;
    }

    const hasRestrictedAccess = await getProjectAccessByUser(user.id, project.organizationId);

    if (hasRestrictedAccess.length === 0) {
      return true;
    }

    const access = await getProjectAccess(project.id, user.id);
    return access && access.level === 'admin';
  }

  return false;
}

export async function canTransferProjectToUser({ user }: Auth, projectId: string, userId: string) {
  const project = await getProject(projectId);

  if (!project) {
    return false;
  }

  if (project.organizationId && user.id === userId) {
    const member = await getMember(project.organizationId, userId);
    return member && hasPermission(member.role, PERMISSIONS.projectTransferToUser);
  }

  return false;
}

export async function canTransferProjectToOrganization(
  { user }: Auth,
  projectId: string,
  organizationId: string,
) {
  const project = await getProject(projectId);

  if (!project) {
    return false;
  }

  if (project.userId && project.userId === user.id) {
    const member = await getMember(organizationId, user.id);
    return member && hasPermission(member.role, PERMISSIONS.projectTransferToOrganization);
  }

  return false;
}

export async function isProjectBillingLocked(projectId: string): Promise<boolean> {
  const project = await getProject(projectId);
  if (!project?.organizationId) {
    return false;
  }
  return isOrganizationLocked(project.organizationId);
}
