import { PageHeader } from '@/components/common/PageHeader';
import { useMessages, useNavigation } from '@/components/hooks';
import { ProjectAddButton } from './ProjectAddButton';

export interface ProjectsHeaderProps {
  allowCreate?: boolean;
}

export function ProjectsHeader({ allowCreate = true }: ProjectsHeaderProps) {
  const { formatMessage, labels } = useMessages();
  const { organizationId } = useNavigation();

  return (
    <PageHeader title={formatMessage(labels.projects)}>
      {allowCreate && <ProjectAddButton organizationId={organizationId} />}
    </PageHeader>
  );
}
