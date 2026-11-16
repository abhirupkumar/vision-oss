'use client';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConfig, useMessages, useUpdateQuery } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getRandomChars } from '@/lib/generate';

const generateId = () => getRandomChars(16);

export interface ProjectShareFormProps {
  projectId: string;
  shareId?: string;
  onSave?: () => void;
  onClose?: () => void;
}

export function ProjectShareForm({ projectId, shareId, onSave, onClose }: ProjectShareFormProps) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const [currentId, setCurrentId] = useState(shareId);
  const { mutateAsync, error, touch, toast: queryToast } = useUpdateQuery(`/projects/${projectId}`);
  const { cloudMode } = useConfig();

  const getUrl = (shareId: string) => {
    if (cloudMode) {
      return `${process.env.cloudUrl}/share/${shareId}`;
    }

    return `${typeof window !== 'undefined' ? window.location.origin : ''}${process.env.basePath || ''}/share/${shareId}`;
  };

  const url = getUrl(currentId);

  const handleGenerate = () => {
    setCurrentId(generateId());
  };

  const handleSwitch = () => {
    setCurrentId(currentId ? null : generateId());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      shareId: currentId,
    };
    await mutateAsync(data, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch(`project:${projectId}`);
        onSave?.();
        onClose?.();
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast('Copied!');
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {getErrorMessage(error)}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch id="share-toggle" checked={!!currentId} onCheckedChange={handleSwitch} />
        <Label htmlFor="share-toggle" className="cursor-pointer">
          {formatMessage(labels.enableShareUrl)}
        </Label>
      </div>

      {currentId && (
        <div className="space-y-2">
          <Label>{formatMessage(labels.shareUrl)}</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <Input value={url} readOnly className="bg-muted pr-16" />
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
              >
                {formatMessage(labels.copy)}
              </Button>
            </div>
            <Button type="button" variant="outline" onClick={handleGenerate} className="shrink-0">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {formatMessage(labels.regenerate)}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            {formatMessage(labels.cancel)}
          </Button>
        )}
        <Button type="submit">{formatMessage(labels.save)}</Button>
      </div>
    </form>
  );
}
