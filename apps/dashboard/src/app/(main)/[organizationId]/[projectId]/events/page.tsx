import type { Metadata } from 'next';
import { EventsPage } from './EventsPage';

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <EventsPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Events',
};
