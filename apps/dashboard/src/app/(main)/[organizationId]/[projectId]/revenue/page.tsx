import type { Metadata } from 'next';
import { RevenuePage } from './RevenuePage';

export default async function ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <RevenuePage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Revenue Analytics',
};
