import { getProject, Project as ProjectTable, getProjectVisitor } from '@vision/db';
import redis from './redis';

type Project = typeof ProjectTable.$inferSelect;
export type Visitor = any;

export async function fetchProject(projectId: string): Promise<Project | null> {
  let project = null;
  project = await getProject(projectId);

  if (!project || project.deletedAt) {
    return null;
  }

  return project as Project;
}

export async function fetchVisitor(projectId: string, visitorId: string): Promise<Visitor | null> {
  let visitor = null;

  visitor = await getProjectVisitor(projectId, visitorId);

  if (!visitor) {
    return null;
  }

  return visitor as Visitor;
}
