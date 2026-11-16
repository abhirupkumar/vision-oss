import { redirect } from 'next/navigation';

export default async function OldIntegrationsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/${resolvedParams.organizationId}/integrations`);
}
