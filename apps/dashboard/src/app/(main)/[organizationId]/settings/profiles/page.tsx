import { redirect } from 'next/navigation';

export default async function ({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  redirect(`/${organizationId}/settings/profile`);
}
