import { Report } from '@vision/db';
import type { Auth } from '../types.js';
import { canViewProject } from './project.js';

export async function canViewReport(auth: Auth, report: typeof Report.$inferSelect) {
  if (auth.user.isAdmin) {
    return true;
  }

  if (auth.user.id === report.userId) {
    return true;
  }

  return !!(await canViewProject(auth, report.projectId));
}

export async function canUpdateReport({ user }: Auth, report: typeof Report.$inferSelect) {
  if (user.isAdmin) {
    return true;
  }

  return user.id === report.userId;
}

export async function canDeleteReport(auth: Auth, report: typeof Report.$inferSelect) {
  return canUpdateReport(auth, report);
}
