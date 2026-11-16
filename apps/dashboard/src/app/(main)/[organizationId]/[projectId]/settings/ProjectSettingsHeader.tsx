import { IconLabel, Row } from '@umami/react-zen';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { useMessages, useNavigation, useProject } from '@/components/hooks';
import { ArrowLeft, Globe } from '@/components/icons';

export function ProjectSettingsHeader() {
  const project = useProject();
  const { formatMessage, labels } = useMessages();
  const { renderUrl } = useNavigation();

  return (
    <>
      <Row marginTop="6">
        <Link href={renderUrl(`/${project.id}`)}>
          <IconLabel icon={<ArrowLeft />} label={formatMessage(labels.project)} />
        </Link>
      </Row>
      <PageHeader title={project?.name} description={project?.domain} icon={<Globe />} />
    </>
  );
}
