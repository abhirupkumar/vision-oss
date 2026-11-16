import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useApi, useMessages } from '@/components/hooks';
import { useDateParameters } from '@/components/hooks/useDateParameters';
import { useFilterParameters } from '@/components/hooks/useFilterParameters';
import { Download } from '@/components/icons';
import { cn } from '@/lib/cn';

export function ExportButton({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();
  const [isLoading, setIsLoading] = useState(false);
  const date = useDateParameters();
  const filters = useFilterParameters();
  const searchParams = useSearchParams();
  const { get } = useApi();

  const handleClick = async () => {
    setIsLoading(true);

    const { zip } = await get(`/projects/${projectId}/export`, {
      ...date,
      ...filters,
      ...searchParams,
      format: 'json',
    });

    await loadZip(zip);

    setIsLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      title={formatMessage(labels.download)}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background',
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      <span className={cn('h-4 w-4', isLoading && 'animate-spin')}>
        <Download />
      </span>
    </button>
  );
}

async function loadZip(zip: string) {
  const binary = atob(zip);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'download.zip';
  a.click();
  URL.revokeObjectURL(url);
}
