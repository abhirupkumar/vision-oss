import type { Metadata } from 'next';
import { LlmPage } from './LlmPage';

export default async function ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <LlmPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'LLM Observability',
};
