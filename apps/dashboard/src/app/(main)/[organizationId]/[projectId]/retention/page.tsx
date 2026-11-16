import { RetentionPage } from './RetentionPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <RetentionPage projectId={projectId} />;
}
