import { getLlmEvents } from '@vision/db';
import { TracesTableClient } from './TracesTableClient';

export async function TracesTable({ projectId }: { projectId: string }) {
  const events = await getLlmEvents(projectId);
  return <TracesTableClient projectId={projectId} events={events} />;
}
