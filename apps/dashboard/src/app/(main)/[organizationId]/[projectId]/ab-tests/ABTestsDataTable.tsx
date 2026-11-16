'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi } from '@/components/hooks';
import { ABTestCreateButton } from './ABTestCreateButton';
import { ABTestsTable } from './ABTestsTable';

export function ABTestsDataTable({ projectId }: { projectId: string }) {
  const { get } = useApi();
  const [selected, setSelected] = useState<any>(null);

  const { data, refetch } = useQuery({
    queryKey: ['ab-tests', projectId],
    queryFn: () => get(`/projects/${projectId}/ab-tests`),
    enabled: !!projectId,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">A/B Tests</h3>
          <p className="text-sm text-muted-foreground">
            Create experiments to compare variants and measure conversions.
          </p>
        </div>
        <ABTestCreateButton projectId={projectId} onSave={refetch} />
      </div>
      <ABTestsTable
        data={data?.data ?? []}
        projectId={projectId}
        onRefetch={refetch}
        onSelect={setSelected}
        selected={selected}
      />
    </div>
  );
}
