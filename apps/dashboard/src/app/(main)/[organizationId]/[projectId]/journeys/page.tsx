import { JourneysPage } from './JourneysPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <JourneysPage projectId={projectId} />;
}
