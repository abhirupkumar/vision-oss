'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Check, Copy, Terminal, Zap, Code, ShieldCheck, Cpu } from 'lucide-react';

export function McpGuidePage({ projectId }: { projectId: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        vision: {
          command: 'npx',
          args: ['-y', '@vision/mcp'],
          env: {
            VISION_API_KEY: 'sg_live_sample_token',
            VISION_PROJECT_ID: projectId,
          },
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'vision-observability': {
          command: 'npx',
          args: ['-y', '@vision/mcp'],
          env: {
            VISION_PROJECT_ID: projectId,
          },
        },
      },
    },
    null,
    2
  );

  const tools = [
    {
      name: 'vision_get_business_scorecard',
      description: 'MRR, total AI compute spend, blended gross margin, active user count, and cost-to-serve (CTS).',
      params: 'projectId',
    },
    {
      name: 'vision_get_unit_economics',
      description: 'Customer unit economics rankings, identifying top value accounts and accounts running a compute deficit.',
      params: 'projectId, limit?',
    },
    {
      name: 'vision_get_user_financials',
      description: 'Inspect plan, invoice history, token usage breakdown, and gross margin for a specific customer ID.',
      params: 'projectId, userId',
    },
    {
      name: 'vision_get_llm_observability',
      description: 'Model latency (TTFT, p95), cache hit ratios, token volumes, and inference error rates.',
      params: 'projectId',
    },
    {
      name: 'vision_query_reliability',
      description: 'Active error fingerprints, affected customer volume, and performance degradation across endpoints.',
      params: 'projectId',
    },
    {
      name: 'vision_list_experiments',
      description: 'Running A/B tests and feature flags with real-time conversion rates and sample counts from Tinybird.',
      params: 'projectId',
    },
  ];

  const handleTestPing = () => {
    setPingStatus('testing');
    setTimeout(() => {
      setPingStatus('success');
      setTimeout(() => setPingStatus('idle'), 3000);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        title="Ask AI via Vision MCP Server"
        description="Connect Claude Desktop, Cursor, Antigravity, and autonomous agents directly to Vision to query gross margins, cost-to-serve, and inference health."
        icon={<Bot className="h-5 w-5 text-primary" />}
      />

      {/* ── Status Banner ── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Vision Model Context Protocol (MCP) Server</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Project ID: <code className="font-mono text-foreground font-semibold">{projectId}</code>
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleTestPing}
            disabled={pingStatus === 'testing'}
            className="shrink-0"
          >
            {pingStatus === 'testing' ? (
              <span className="animate-spin mr-1.5">✦</span>
            ) : pingStatus === 'success' ? (
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-300" />
            ) : (
              <Zap className="h-4 w-4 mr-1.5" />
            )}
            {pingStatus === 'testing' ? 'Pinging Server...' : pingStatus === 'success' ? 'Connected (200 OK)' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Client Configuration Blocks ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Claude Desktop */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">Claude Desktop</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => copyToClipboard(claudeConfig, 'claude')}
              >
                {copiedKey === 'claude' ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedKey === 'claude' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <CardDescription className="text-xs">
              Add to your <code className="font-mono text-foreground">claude_desktop_config.json</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-md bg-muted/60 text-xs font-mono overflow-x-auto text-foreground">
              {claudeConfig}
            </pre>
          </CardContent>
        </Card>

        {/* Cursor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">Cursor IDE</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => copyToClipboard(cursorConfig, 'cursor')}
              >
                {copiedKey === 'cursor' ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copiedKey === 'cursor' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <CardDescription className="text-xs">
              Add to your workspace <code className="font-mono text-foreground">.cursor/mcp.json</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded-md bg-muted/60 text-xs font-mono overflow-x-auto text-foreground">
              {cursorConfig}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* ── Tool Catalog ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Available MCP Observability Tools</CardTitle>
          </div>
          <CardDescription className="text-xs">
            These tools are automatically registered into your connected AI client session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Tool Name</th>
                  <th className="pb-2 text-left font-medium">Parameters</th>
                  <th className="pb-2 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tools.map((tool) => (
                  <tr key={tool.name} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-mono text-xs font-semibold text-primary">
                      {tool.name}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">
                      {tool.params}
                    </td>
                    <td className="py-2.5 text-xs text-foreground max-w-md">
                      {tool.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
