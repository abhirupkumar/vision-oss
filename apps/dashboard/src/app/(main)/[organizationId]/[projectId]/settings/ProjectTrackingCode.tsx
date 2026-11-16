'use client';
import { toast } from 'sonner';
import { useConfig, useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SCRIPT_NAME = 'script.js';

export function ProjectTrackingCode({
  projectId,
  hostUrl,
}: {
  projectId: string;
  hostUrl?: string;
}) {
  const { formatMessage, messages, labels } = useMessages();
  const config = useConfig();

  const trackerScriptName =
    config?.trackerScriptName?.split(',')?.map((n: string) => n.trim())?.[0] || SCRIPT_NAME;

  const getUrl = () => {
    if (config?.cloudMode) {
      return `${process.env.cloudUrl}/${trackerScriptName}`;
    }

    return `${hostUrl || (typeof window !== 'undefined' ? window.location.origin : '')}${
      process.env.basePath || ''
    }/${trackerScriptName}`;
  };

  const url = trackerScriptName?.startsWith('http') ? trackerScriptName : getUrl();

  const code = `<script defer src="${url}" data-project-id="${projectId}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast('Copied!');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <Label className="text-lg font-semibold">{formatMessage(labels.trackingCode)}</Label>
        <p className="text-sm text-muted-foreground">{formatMessage(messages.trackingCode)}</p>
      </div>
      <div className="relative group">
        <Textarea
          value={code}
          readOnly
          className="min-h-[100px] resize-none font-mono text-xs bg-muted pr-16"
        />
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {formatMessage(labels.copy)}
        </Button>
      </div>
    </div>
  );
}
