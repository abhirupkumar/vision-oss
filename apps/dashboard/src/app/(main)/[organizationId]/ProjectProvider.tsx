'use client';
import { createContext, type ReactNode } from 'react';
import { useProjectQuery } from '@/components/hooks/queries/useProjectQuery';
export type Project = any;

export const ProjectContext = createContext<Project>(null);

export function ProjectProvider({
  projectId,
  initialProject,
  children,
}: {
  projectId: string;
  initialProject?: Project;
  children: ReactNode;
}) {
  const { data, isFetching, isLoading } = useProjectQuery(projectId);
  const project = initialProject || data;

  if (!initialProject && isFetching && isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>;
}
