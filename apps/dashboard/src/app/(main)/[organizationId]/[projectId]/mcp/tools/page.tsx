import type { Metadata } from 'next';
import { McpGuidePage } from '../McpGuidePage';

export default async function ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <McpGuidePage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'MCP Tool Catalog',
};
