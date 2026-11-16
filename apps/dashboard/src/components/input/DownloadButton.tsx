import Papa from 'papaparse';
import { useMessages } from '@/components/hooks';
import { Download } from '@/components/icons';
import { cn } from '@/lib/cn';

export function DownloadButton({
  filename = 'data',
  data,
}: {
  filename?: string;
  data?: any;
  onClick?: () => void;
}) {
  const { formatMessage, labels } = useMessages();

  const handleClick = async () => {
    downloadCsv(`${filename}.csv`, Papa.unparse(data));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!data || data.length === 0}
      title={formatMessage(labels.download)}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background',
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      <span className="h-4 w-4">
        <Download />
      </span>
    </button>
  );
}

function downloadCsv(filename: string, data: any) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
