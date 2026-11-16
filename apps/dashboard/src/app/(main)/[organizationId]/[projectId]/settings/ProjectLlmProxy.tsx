'use client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export function ProjectLlmProxy({
  projectId,
}: {
  projectId: string;
}) {
  const getHostUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://api.vision.com';
  };

  const code = `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "${getHostUrl()}/llm-proxy/openai/v1",
  defaultHeaders: {
    "X-Vision-Project": "${projectId}",
    "X-Vision-Api-Key": process.env.OPENAI_API_KEY,
  },
});`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast('Copied!');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <Label className="text-lg font-semibold">LLM Observability Proxy</Label>
        <p className="text-sm text-muted-foreground">
          Track LLM costs, usage, and latency with zero integration effort. Just change your baseURL and add your project ID header.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">Proxy Base URL (OpenAI)</Label>
        <Input readOnly value={`${getHostUrl()}/llm-proxy/openai/v1`} className="font-mono text-sm bg-muted" />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Example Configuration</Label>
        <div className="relative group">
          <Textarea
            value={code}
            readOnly
            className="min-h-[160px] resize-none font-mono text-xs bg-muted pr-16"
          />
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
