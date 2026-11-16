'use client';

import { Check, Code2, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TrackingScriptStepProps {
  projectId: string;
}

export function TrackingScriptStep({ projectId }: TrackingScriptStepProps) {
  const [copied, setCopied] = useState(false);

  const scriptUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/script.js` : '/script.js';

  const snippet = `<script defer src="${scriptUrl}" data-project-id="${projectId}"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Install Tracking Script</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Paste this snippet into the{' '}
          <code className="text-xs bg-muted rounded px-1 py-0.5">&lt;head&gt;</code> of your website
          to start collecting analytics data.
          <span className="text-xs font-medium text-primary ml-1">Optional</span>
        </p>
      </div>

      {/* Code block */}
      <div className="relative group rounded-lg border border-border bg-muted/40 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/60">
          <Code2 size={13} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">HTML</span>
        </div>
        <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {snippet}
        </pre>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute top-9 right-3 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={12} className="mr-1 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} className="mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Setup Instructions
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground list-none">
          {[
            'Copy the script above.',
            'Paste it inside the <head> tag of every page you want to track.',
            'Deploy your changes — tracking starts automatically.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Skip note */}
      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        You can always find this snippet later in{' '}
        <span className="font-medium text-foreground">Project Settings → Tracking Code</span>.
      </p>
    </div>
  );
}
