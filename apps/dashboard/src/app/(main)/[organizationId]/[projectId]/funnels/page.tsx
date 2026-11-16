import { FunnelPage } from './FunnelPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <FunnelPage projectId={projectId} />;
}
