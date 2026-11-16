import { NotificationsPage } from './NotificationsPage';

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <NotificationsPage projectId={projectId} />;
}
