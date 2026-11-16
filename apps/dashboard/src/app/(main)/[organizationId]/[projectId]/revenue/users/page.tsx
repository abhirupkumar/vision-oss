import type { Metadata } from 'next';
import { UnitEconomicsPage } from '../../unit-economics/UnitEconomicsPage';

export default async function ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <UnitEconomicsPage projectId={projectId} />;
}

export const metadata: Metadata = {
  title: 'Customer Margins by User',
};
