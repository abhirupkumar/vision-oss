import { ABTestsPage } from './ABTestsPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ABTestsPage projectId={projectId} />;
}
