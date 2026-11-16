import type { Metadata } from 'next';
import { TestConsolePage } from './TestConsolePage';

async function getEnabled() {
  return !!process.env.ENABLE_TEST_CONSOLE;
}

export default async function ({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const enabled = await getEnabled();

  if (!enabled) {
    return null;
  }

  return <TestConsolePage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Test Console',
};
