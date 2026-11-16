import { useContext } from 'react';
import { ProjectContext } from '@/app/(main)/[organizationId]/ProjectProvider';

export function useProject() {
  return useContext(ProjectContext);
}
