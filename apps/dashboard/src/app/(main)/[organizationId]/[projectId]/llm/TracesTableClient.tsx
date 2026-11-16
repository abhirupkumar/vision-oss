'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchConversation } from './actions';
import {
  Wrench,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Code,
  FileText,
  Send,
  ArrowDownLeft,
  MessageSquare,
  Bot,
  User as UserIcon,
  Cpu,
  Coins,
  Clock,
  Zap,
  AlertTriangle,
  Globe,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash,
  Terminal,
} from 'lucide-react';

// ── Status helpers ────────────────────────────────────────────────────────────

type TraceStatus = 'success' | 'error' | 'timeout' | 'rate_limited' | 'cancelled' | null | undefined;

function StatusBadge({ status }: { status: TraceStatus }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    success: { label: 'OK', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    error: { label: 'Error', cls: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' },
    timeout: { label: 'Timeout', cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    rate_limited: { label: 'Rate Limited', cls: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    cancelled: { label: 'Cancelled', cls: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' },
  };
  const cfg = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={`text-[10px] py-0 ${cfg.cls}`}>
      {cfg.label}
    </Badge>
  );
}

// ── Timestamp formatting ──────────────────────────────────────────────────────

function parseUtcDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  if (raw.endsWith('Z') || raw.includes('+') || raw.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(raw);
  }
  return new Date(raw.replace(' ', 'T') + 'Z');
}

function formatRelativeTime(raw: string | null | undefined): string {
  const date = parseUtcDate(raw);
  if (!date || isNaN(date.getTime())) return '—';

  const nowMs = Date.now();
  const diffMs = nowMs - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
}

function formatExactDate(raw: string | Date | null | undefined): string {
  if (!raw) return '—';
  const d = typeof raw === 'string' ? parseUtcDate(raw) : raw;
  if (!d || isNaN(d.getTime())) return '—';
  return d.toISOString().replace('T', ' ').slice(0, 23) + ' UTC';
}

function safeParseJson(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Copy Button Helper ────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted border border-border/50"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}

// ── JSON Tokenizer & Syntax Highlighter ──────────────────────────────────────

interface JsonToken {
  type: 'key' | 'colon' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'whitespace';
  text: string;
}

function tokenizeJsonLine(line: string): JsonToken[] {
  const tokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const parts: JsonToken[] = [];

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'whitespace', text: line.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.endsWith(':')) {
      parts.push({ type: 'key', text: token.slice(0, -1) });
      parts.push({ type: 'colon', text: ':' });
    } else if (token.startsWith('"')) {
      parts.push({ type: 'string', text: token });
    } else if (token === 'true' || token === 'false') {
      parts.push({ type: 'boolean', text: token });
    } else if (token === 'null') {
      parts.push({ type: 'null', text: token });
    } else if (/^-?\d/.test(token)) {
      parts.push({ type: 'number', text: token });
    } else {
      parts.push({ type: 'punctuation', text: token });
    }
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < line.length) {
    parts.push({ type: 'whitespace', text: line.slice(lastIndex) });
  }
  return parts;
}

function JsonEditorViewer({
  data,
  title = 'JSON',
  maxHeight = 'max-h-[calc(85vh-240px)]',
}: {
  data: any;
  title?: string;
  maxHeight?: string;
}) {
  const [copied, setCopied] = useState(false);
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const lines = jsonStr.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden font-mono text-xs shadow-sm flex flex-col w-full">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <Code className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-sans font-medium text-xs text-zinc-300">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-sans">
            Read-only JSON
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-sans text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50 cursor-pointer"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>

      <div className={`p-3 overflow-y-auto flex leading-5 ${maxHeight}`}>
        <div className="select-none pr-3 text-right text-zinc-600 border-r border-zinc-800/80 mr-3 flex flex-col font-mono text-xs shrink-0 min-w-8">
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto whitespace-pre font-mono text-xs">
          {lines.map((line, i) => {
            const tokens = tokenizeJsonLine(line);
            return (
              <div key={i}>
                {tokens.map((tok, j) => {
                  switch (tok.type) {
                    case 'key':
                      return <span key={j} className="text-sky-400 font-medium">{tok.text}</span>;
                    case 'colon':
                      return <span key={j} className="text-zinc-500">{tok.text}</span>;
                    case 'string':
                      return <span key={j} className="text-emerald-300">{tok.text}</span>;
                    case 'number':
                      return <span key={j} className="text-amber-300">{tok.text}</span>;
                    case 'boolean':
                      return <span key={j} className="text-purple-400 font-semibold">{tok.text}</span>;
                    case 'null':
                      return <span key={j} className="text-rose-400 font-semibold">{tok.text}</span>;
                    case 'punctuation':
                      return <span key={j} className="text-zinc-500">{tok.text}</span>;
                    default:
                      return <span key={j}>{tok.text}</span>;
                  }
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Markdown Content Renderer ─────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:opacity-80 break-all"
            >
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const isCodeBlock = className?.includes('language-');
            if (isCodeBlock) {
              return (
                <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2.5 my-2 font-mono text-xs text-zinc-100 overflow-x-auto">
                  <code>{children}</code>
                </div>
              );
            }
            return (
              <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px] text-foreground" {...props}>
                {children}
              </code>
            );
          },
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || 'Image'}
              className="max-w-full rounded-md border border-border my-2 max-h-80 object-contain"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border-collapse border border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/50 px-2 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Chat Message Bubble ───────────────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | string;
  content: any;
  reasoning?: string | null;
  tool_calls?: any[];
  name?: string;
}

function ChatMessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const role = (message.role || 'user').toLowerCase();
  const [showThinking, setShowThinking] = useState(false);

  const roleConfig = {
    system: {
      label: 'System',
      icon: <Cpu className="w-3.5 h-3.5 text-zinc-400" />,
      border: 'border-zinc-800 bg-zinc-900/40 text-zinc-300',
      badge: 'bg-zinc-800 text-zinc-300',
    },
    user: {
      label: 'User',
      icon: <UserIcon className="w-3.5 h-3.5 text-primary" />,
      border: 'border-primary/20 bg-primary/5 text-foreground',
      badge: 'bg-primary/20 text-primary border-primary/30',
    },
    assistant: {
      label: 'Assistant',
      icon: <Bot className="w-3.5 h-3.5 text-emerald-500" />,
      border: 'border-emerald-500/20 bg-emerald-500/5 text-foreground',
      badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    tool: {
      label: message.name ? `Tool: ${message.name}` : 'Tool Result',
      icon: <Wrench className="w-3.5 h-3.5 text-amber-500" />,
      border: 'border-amber-500/20 bg-amber-500/5 text-foreground',
      badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    },
  }[role] ?? {
    label: role.toUpperCase(),
    icon: <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />,
    border: 'border-border bg-muted/20 text-foreground',
    badge: 'bg-muted text-muted-foreground',
  };

  // Extract raw text or multimodal parts
  const rawContent = message.content;
  let textContent = '';
  let parts: any[] = [];

  if (typeof rawContent === 'string') {
    textContent = rawContent;
  } else if (Array.isArray(rawContent)) {
    parts = rawContent;
    textContent = rawContent
      .map((p: any) => (typeof p === 'string' ? p : p?.text ?? ''))
      .filter(Boolean)
      .join('\n\n');
  } else if (typeof rawContent === 'object' && rawContent !== null) {
    textContent = JSON.stringify(rawContent, null, 2);
  }

  // Check for embedded <think> blocks if not already extracted
  let reasoning = message.reasoning || null;
  if (!reasoning && textContent.includes('<think>')) {
    const thinkMatch = textContent.match(/<think>\n?([\s\S]*?)\n?<\/think>/i);
    if (thinkMatch) {
      reasoning = thinkMatch[1].trim();
      textContent = textContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${roleConfig.border} flex flex-col gap-2.5 transition-all`}>
      {/* Role Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {roleConfig.icon}
          <span className="font-semibold text-xs">{roleConfig.label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">#{index + 1}</span>
        </div>
        <CopyButton text={textContent || JSON.stringify(rawContent)} label="Copy" />
      </div>

      {/* Optional Reasoning / Thinking block */}
      {reasoning && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
          <button
            type="button"
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center justify-between w-full text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thinking Process ({reasoning.length} chars)</span>
            </div>
            {showThinking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showThinking && (
            <div className="mt-2 pt-2 border-t border-amber-500/20 text-muted-foreground font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {reasoning}
            </div>
          )}
        </div>
      )}

      {/* Message Body */}
      {parts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {parts.map((p, pIdx) => {
            if (p.type === 'text') {
              return <MarkdownContent key={pIdx} content={p.text} />;
            }
            if (p.type === 'image_url') {
              return (
                <div key={pIdx} className="rounded-md border border-border p-2 bg-background/50">
                  <img
                    src={p.image_url?.url}
                    alt="User attachment"
                    className="max-w-full rounded object-contain max-h-80"
                  />
                </div>
              );
            }
            return (
              <pre key={pIdx} className="bg-muted p-2 rounded text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(p, null, 2)}
              </pre>
            );
          })}
        </div>
      ) : textContent ? (
        <MarkdownContent content={textContent} />
      ) : (
        <span className="text-muted-foreground text-xs italic">Empty message content</span>
      )}

      {/* Tool Calls from Assistant */}
      {Array.isArray(message.tool_calls) && message.tool_calls.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3 h-3 text-amber-500" />
            Function / Tool Calls ({message.tool_calls.length})
          </span>
          {message.tool_calls.map((tc: any, tcIdx: number) => {
            const funcName = tc.function?.name || tc.name || 'tool';
            const funcArgs = tc.function?.arguments || tc.arguments;
            const parsedArgs = typeof funcArgs === 'string' ? safeParseJson(funcArgs) ?? funcArgs : funcArgs;
            return (
              <div key={tcIdx} className="rounded border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{funcName}</span>
                  {tc.id && <span className="font-mono text-[10px] text-muted-foreground">{tc.id}</span>}
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-[11px] font-mono text-zinc-200 overflow-x-auto">
                  {typeof parsedArgs === 'object' ? JSON.stringify(parsedArgs, null, 2) : String(funcArgs)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Extract Messages & Response from Stored Payloads ──────────────────────────

function extractConversationMessages(currentSpan: any): {
  messages: ChatMessage[];
  hasTools: boolean;
  toolCalls: any[];
  toolDefs: any[];
  rawPayload: any;
  rawResponse: any;
} {
  const payloadJson = safeParseJson(currentSpan.payload);
  const responseJson = safeParseJson(currentSpan.response);

  // 1. Extract input messages from payload
  let inputMessages: ChatMessage[] = [];
  if (Array.isArray(payloadJson?.messages)) {
    inputMessages = payloadJson.messages;
  } else if (Array.isArray(payloadJson?.contents)) {
    // Google Gemini format
    inputMessages = payloadJson.contents.map((c: any) => ({
      role: c.role === 'model' ? 'assistant' : 'user',
      content: c.parts?.map((p: any) => p.text).join('\n') ?? '',
    }));
  } else if (payloadJson?.prompt) {
    inputMessages = [{ role: 'user', content: payloadJson.prompt }];
  } else if (typeof currentSpan.payload === 'string' && currentSpan.payload.trim()) {
    inputMessages = [{ role: 'user', content: currentSpan.payload }];
  }

  // 2. Extract assistant response from response
  let assistantMessage: ChatMessage | null = null;
  if (responseJson?.choices?.[0]?.message) {
    const msg = responseJson.choices[0].message;
    assistantMessage = {
      role: 'assistant',
      content: msg.content ?? '',
      reasoning: msg.reasoning || msg.reasoning_content || null,
      tool_calls: msg.tool_calls ?? [],
    };
  } else if (responseJson?.content && Array.isArray(responseJson.content)) {
    // Anthropic format
    const textPart = responseJson.content.find((p: any) => p.type === 'text')?.text ?? '';
    const thinkingPart = responseJson.content.find((p: any) => p.type === 'thinking')?.thinking ?? null;
    const toolParts = responseJson.content.filter((p: any) => p.type === 'tool_use');
    assistantMessage = {
      role: 'assistant',
      content: textPart,
      reasoning: thinkingPart,
      tool_calls: toolParts,
    };
  } else if (responseJson?.candidates?.[0]?.content?.parts) {
    // Gemini format
    assistantMessage = {
      role: 'assistant',
      content: responseJson.candidates[0].content.parts.map((p: any) => p.text).join('\n'),
    };
  } else if (typeof currentSpan.response === 'string' && currentSpan.response.trim()) {
    // Check if raw SSE
    if (currentSpan.response.startsWith('data:')) {
      let accumulatedText = '';
      let accumulatedReasoning = '';
      const lines = currentSpan.response.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const dataStr = line.replace(/^data:\s*/, '').trim();
        if (dataStr === '[DONE]') continue;
        const chunk = safeParseJson(dataStr);
        const delta = chunk?.choices?.[0]?.delta;
        if (delta?.content) accumulatedText += delta.content;
        if (delta?.reasoning || delta?.reasoning_content) {
          accumulatedReasoning += delta.reasoning || delta.reasoning_content;
        }
      }
      assistantMessage = {
        role: 'assistant',
        content: accumulatedText,
        reasoning: accumulatedReasoning || null,
      };
    } else {
      assistantMessage = {
        role: 'assistant',
        content: currentSpan.response,
      };
    }
  }

  const allMessages: ChatMessage[] = [
    ...inputMessages,
    ...(assistantMessage ? [assistantMessage] : []),
  ];

  // Tool calls & definitions
  const toolCalls = safeParseJson(currentSpan.tool_calls) ?? assistantMessage?.tool_calls ?? [];
  const toolDefs = safeParseJson(currentSpan.tool_definitions) ?? payloadJson?.tools ?? [];

  return {
    messages: allMessages,
    hasTools: Array.isArray(toolCalls) && toolCalls.length > 0,
    toolCalls: Array.isArray(toolCalls) ? toolCalls : [],
    toolDefs: Array.isArray(toolDefs) ? toolDefs : [],
    rawPayload: payloadJson ?? currentSpan.payload,
    rawResponse: responseJson ?? currentSpan.response,
  };
}

// ── Full Conversation Thread Modal ────────────────────────────────────────────

function ConversationModal({
  projectId,
  sessionId,
  traceId,
  open,
  onClose,
}: {
  projectId: string;
  sessionId: string;
  traceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [spans, setSpans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const idToFetch = sessionId || traceId;
    fetchConversation(projectId, idToFetch, Boolean(sessionId))
      .then((data) => {
        setSpans(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [open, projectId, sessionId, traceId]);

  // Group spans by trace_id (each turn is one trace)
  const turns = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const span of spans) {
      const tid = span.trace_id || span.traceId || span.id;
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid)!.push(span);
    }
    return Array.from(map.entries()).map(([tid, turnSpans]) => ({
      traceId: tid,
      rootSpan: turnSpans.find((s) => !s.parent_event_id && !s.parentEventId) || turnSpans[0],
      spans: turnSpans,
    }));
  }, [spans]);

  const totalCost = spans.reduce((sum, s) => sum + Number(s.cost ?? 0), 0);
  const totalTokens = spans.reduce((sum, s) => sum + Number(s.total_tokens ?? s.totalTokens ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[85vw] max-w-[85vw] sm:max-w-[85vw] md:max-w-[85vw] lg:max-w-[85vw] h-[90vh] max-h-[90vh] flex flex-col p-6 overflow-hidden"
        style={{ width: '85vw', maxWidth: '85vw', height: '90vh', maxHeight: '90vh' }}
      >
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Full Conversation Thread</DialogTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {sessionId ? `Session ID: ${sessionId}` : `Trace ID: ${traceId}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono bg-muted/50 px-3 py-1.5 rounded-md">
              <div>
                <span className="text-muted-foreground">Turns: </span>
                <span className="font-semibold text-foreground">{turns.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tokens: </span>
                <span className="font-semibold text-foreground">{totalTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Cost: </span>
                <span className="font-semibold text-emerald-500">${totalCost.toFixed(5)}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-32 text-center text-muted-foreground animate-pulse text-sm">
            Loading full conversation history...
          </div>
        ) : turns.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground text-sm">
            No related conversation traces found for this session.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mt-4 pr-2 flex flex-col gap-6">
            {turns.map(({ traceId: tId, rootSpan, spans: turnSpans }, turnIdx) => {
              const { messages } = extractConversationMessages(rootSpan);
              const childSpans = turnSpans.filter((s) => s.id !== rootSpan.id);

              return (
                <div key={tId} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  {/* Turn Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                        Turn {turnIdx + 1}
                      </span>
                      <Badge variant="outline" className="font-mono">{rootSpan.model}</Badge>
                      <StatusBadge status={rootSpan.status} />
                      <span className="text-muted-foreground">{formatRelativeTime(rootSpan.created_at || rootSpan.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                      <span>{rootSpan.latency_ms ?? rootSpan.latencyMs}ms</span>
                      <span>${Number(rootSpan.cost ?? 0).toFixed(5)}</span>
                      <span>{rootSpan.total_tokens ?? rootSpan.totalTokens ?? 0} tok</span>
                    </div>
                  </div>

                  {/* Turn Messages */}
                  <div className="flex flex-col gap-3">
                    {messages.length > 0 ? (
                      messages.map((m, mIdx) => (
                        <ChatMessageBubble key={mIdx} message={m} index={mIdx} />
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic p-2">
                        No payload recorded for this turn.
                      </div>
                    )}
                  </div>

                  {/* Child Spans (e.g. tools, retrieval) */}
                  {childSpans.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/40 pl-4 border-l-2 border-primary/20 flex flex-col gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-primary" />
                        Nested Operations / Tool Calls ({childSpans.length})
                      </span>
                      {childSpans.map((cs, csIdx) => (
                        <div key={cs.id || csIdx} className="rounded border bg-muted/30 p-2.5 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{cs.span_type || cs.spanType || 'span'}</Badge>
                            <span className="font-mono font-medium">{cs.name || cs.model}</span>
                            <StatusBadge status={cs.status} />
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                            <span>{cs.latency_ms ?? cs.latencyMs}ms</span>
                            <span>${Number(cs.cost ?? 0).toFixed(5)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Individual Trace Detail Modal ─────────────────────────────────────────────

function TraceDialog({
  trace,
  projectId,
  open,
  onClose,
  onOpenConversation,
}: {
  trace: any;
  projectId: string;
  open: boolean;
  onClose: () => void;
  onOpenConversation: (span: any) => void;
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) {
      onClose();
      setActiveTab('overview');
    }
  }, [onClose]);

  useEffect(() => {
    if (open) setActiveTab('overview');
  }, [open]);

  if (!trace) return null;

  const currentSpan = trace;
  const createdAt = currentSpan.created_at || currentSpan.createdAt;

  // Extract structured conversation, tools, and raw payloads
  const { messages, hasTools, toolCalls, toolDefs, rawPayload, rawResponse } =
    extractConversationMessages(currentSpan);

  // Parse complex attributes
  const modelParams = safeParseJson(currentSpan.model_parameters) ?? {};
  const metadata = safeParseJson(currentSpan.metadata) ?? {};
  const scores = safeParseJson(currentSpan.scores) ?? [];
  const tags = safeParseJson(currentSpan.tags) ?? [];
  const usageDetails = safeParseJson(currentSpan.usage_details) ?? {};
  const isError = currentSpan.status === 'error' || Boolean(currentSpan.error_message || currentSpan.errorMessage);

  const sessionId = currentSpan.session_id || currentSpan.sessionId;
  const traceId = currentSpan.trace_id || currentSpan.traceId;
  const spanId = currentSpan.id;
  const parentEventId = currentSpan.parent_event_id || currentSpan.parentEventId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] md:max-w-[80vw] lg:max-w-[80vw] h-[85vh] max-h-[85vh] flex flex-col p-6 overflow-hidden"
        style={{ width: '80vw', maxWidth: '80vw', height: '85vh', maxHeight: '85vh' }}
      >
        {/* Top Header */}
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-wrap">
              {currentSpan.name && (
                <span className="font-semibold text-sm text-foreground mr-1">{currentSpan.name}</span>
              )}
              <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono">
                {currentSpan.model}
              </Badge>
              {currentSpan.provider && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {currentSpan.provider}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {currentSpan.span_type || currentSpan.spanType || 'generation'}
              </Badge>
              <span className="text-xs font-normal text-muted-foreground">
                {formatRelativeTime(createdAt)}
              </span>
              <StatusBadge status={currentSpan.status} />
            </div>

            {/* Conversation Thread Button */}
            {(sessionId || traceId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenConversation(currentSpan)}
                className="flex items-center gap-1.5 text-xs h-8 border-primary/30 hover:border-primary text-primary"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>View Full Conversation</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Tab Controls: Overview, Messages, Payload, Response, Tools */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-3">
          <TabsList className="shrink-0 w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Messages ({messages.length})</span>
            </TabsTrigger>
            <TabsTrigger value="payload" className="flex items-center gap-1.5 text-xs">
              <Send className="h-3.5 w-3.5" />
              <span>Payload</span>
            </TabsTrigger>
            <TabsTrigger value="response" className="flex items-center gap-1.5 text-xs">
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>Response</span>
            </TabsTrigger>
            {(hasTools || toolDefs.length > 0) && (
              <TabsTrigger value="tools" className="flex items-center gap-1.5 text-xs">
                <Wrench className="h-3.5 w-3.5" />
                <span>Tools ({toolCalls.length})</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── TAB 1: OVERVIEW ── */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-5">
            {/* 1. Performance Metric Grid */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Prompt tokens', value: currentSpan.prompt_tokens ?? currentSpan.promptTokens ?? 0 },
                { label: 'Completion tokens', value: currentSpan.completion_tokens ?? currentSpan.completionTokens ?? 0 },
                { label: 'Latency', value: `${currentSpan.latency_ms ?? currentSpan.latencyMs ?? 0}ms` },
                { label: 'Cost', value: `$${Number(currentSpan.cost ?? 0).toFixed(5)}` },
                ...(currentSpan.ttft_ms || currentSpan.ttftMs
                  ? [{ label: 'TTFT (First Token)', value: `${currentSpan.ttft_ms ?? currentSpan.ttftMs}ms` }]
                  : []),
                ...(currentSpan.score != null
                  ? [{ label: 'Score', value: `${(Number(currentSpan.score) * 100).toFixed(0)}%` }]
                  : []),
                ...(currentSpan.template_name || currentSpan.templateName
                  ? [{ label: 'Template', value: currentSpan.template_name ?? currentSpan.templateName }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3 border border-border/40">
                  <p className="text-muted-foreground text-[11px]">{label}</p>
                  <p className="font-mono font-medium text-sm mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* 2. Token Details & Cache Breakdown */}
            <div className="rounded-lg border border-border bg-card p-4 text-xs">
              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Token Breakdown &amp; Efficiency
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                <div>
                  <span className="text-muted-foreground text-[11px]">Total Tokens:</span>
                  <p className="text-sm font-semibold mt-0.5">
                    {currentSpan.total_tokens ?? currentSpan.totalTokens ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Prompt Cache Reads:</span>
                  <p className="text-sm font-semibold mt-0.5 text-emerald-500">
                    {currentSpan.prompt_cache_read_tokens ?? currentSpan.promptCacheReadTokens ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Prompt Cache Writes:</span>
                  <p className="text-sm font-semibold mt-0.5">
                    {currentSpan.prompt_cache_write_tokens ?? currentSpan.promptCacheWriteTokens ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Reasoning Tokens:</span>
                  <p className="text-sm font-semibold mt-0.5 text-purple-400">
                    {currentSpan.reasoning_tokens ?? currentSpan.reasoningTokens ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Span Identity & Tracing Hierarchy */}
            <div className="rounded-lg border border-border bg-card p-4 text-xs">
              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Hash className="w-3.5 h-3.5 text-primary" />
                Tracing &amp; Span Identity
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Span ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground">{spanId}</span>
                    <CopyButton text={spanId} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Trace ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground">{traceId}</span>
                    <CopyButton text={traceId} />
                  </div>
                </div>
                {parentEventId && (
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                    <span className="text-muted-foreground">Parent Span ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground">{parentEventId}</span>
                      <CopyButton text={parentEventId} />
                    </div>
                  </div>
                )}
                {sessionId && (
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                    <span className="text-muted-foreground">Session ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground">{sessionId}</span>
                      <CopyButton text={sessionId} />
                    </div>
                  </div>
                )}
                {currentSpan.request_path && (
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40 col-span-2">
                    <span className="text-muted-foreground">Request Path:</span>
                    <span className="text-foreground">{currentSpan.request_path}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Context & Environment */}
            {(currentSpan.user_id ||
              currentSpan.environment ||
              currentSpan.release ||
              currentSpan.version ||
              currentSpan.country_code ||
              (tags && tags.length > 0)) && (
              <div className="rounded-lg border border-border bg-card p-4 text-xs">
                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Context &amp; Environment
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {currentSpan.user_id && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">User ID</span>
                      <p className="font-mono mt-0.5">{currentSpan.user_id}</p>
                    </div>
                  )}
                  {currentSpan.environment && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">Environment</span>
                      <p className="font-mono mt-0.5">{currentSpan.environment}</p>
                    </div>
                  )}
                  {currentSpan.release && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">Release</span>
                      <p className="font-mono mt-0.5">{currentSpan.release}</p>
                    </div>
                  )}
                  {currentSpan.version && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">Version</span>
                      <p className="font-mono mt-0.5">{currentSpan.version}</p>
                    </div>
                  )}
                  {currentSpan.country_code && (
                    <div>
                      <span className="text-muted-foreground text-[11px]">Country</span>
                      <p className="font-mono mt-0.5 uppercase">{currentSpan.country_code}</p>
                    </div>
                  )}
                </div>
                {tags && tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground text-[11px] mr-1">Tags:</span>
                    {tags.map((t: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Timeline & Wall Clock */}
            <div className="rounded-lg border border-border bg-card p-4 text-xs">
              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Execution Timeline
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground text-[10px]">Started At</span>
                  <p className="mt-0.5">{formatExactDate(currentSpan.start_time || createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">First Token Arrival</span>
                  <p className="mt-0.5">
                    {currentSpan.completion_start_time
                      ? formatExactDate(currentSpan.completion_start_time)
                      : currentSpan.ttft_ms
                      ? `+${currentSpan.ttft_ms}ms`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Finished At</span>
                  <p className="mt-0.5">{formatExactDate(currentSpan.end_time)}</p>
                </div>
              </div>
            </div>

            {/* 6. Model Parameters */}
            {modelParams && Object.keys(modelParams).length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4 text-xs">
                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  Model Parameters
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(modelParams).map(([k, v]) => (
                    <div key={k} className="px-2 py-1 rounded bg-muted font-mono text-xs border border-border/50">
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Metadata */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Custom Metadata
                </span>
                <JsonEditorViewer data={metadata} title="Metadata" maxHeight="max-h-52" />
              </div>
            )}

            {/* 8. Evaluation Scores */}
            {(currentSpan.score != null || (scores && scores.length > 0)) && (
              <div className="rounded-lg border border-border bg-card p-4 text-xs">
                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quality &amp; Evaluation Scores
                </span>
                {currentSpan.score != null && (
                  <div className="text-sm font-semibold font-mono text-primary mb-2">
                    Overall Score: {(Number(currentSpan.score) * 100).toFixed(0)}%
                  </div>
                )}
                {scores && scores.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {scores.map((sc: any, i: number) => (
                      <div key={i} className="px-2 py-1 rounded bg-muted text-xs font-mono">
                        <span className="text-muted-foreground">{sc.name}: </span>
                        <span>{sc.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 9. Error Details */}
            {isError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>
                    Error {currentSpan.http_status_code ? `(HTTP ${currentSpan.http_status_code})` : ''}:{' '}
                    {currentSpan.error_code || 'Unknown Error'}
                  </span>
                </div>
                <pre className="font-mono text-xs whitespace-pre-wrap mt-2 p-2 rounded bg-zinc-950 text-red-300 border border-red-900/50">
                  {currentSpan.error_message || currentSpan.errorMessage || 'Unknown error occurred'}
                </pre>
              </div>
            )}

            {/* 10. Body Truncation Warning */}
            {Boolean(currentSpan.body_truncated) && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Payload or response was truncated at 50,000 characters to protect storage.
                </span>
              </div>
            )}
          </TabsContent>

          {/* ── TAB 2: MESSAGES (Chat UI) ── */}
          <TabsContent value="messages" className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3">
            <div className="text-xs text-muted-foreground mb-1">
              Conversation timeline recreated from full request payload &amp; response ({messages.length} messages)
            </div>
            {messages.length > 0 ? (
              messages.map((m, idx) => <ChatMessageBubble key={idx} message={m} index={idx} />)
            ) : (
              <div className="py-24 text-center text-muted-foreground text-xs italic">
                No conversation messages found in stored payload.
              </div>
            )}
          </TabsContent>

          {/* ── TAB 3: PAYLOAD (Full JSON) ── */}
          <TabsContent value="payload" className="flex-1 overflow-hidden mt-4 flex flex-col">
            <div className="mb-2 text-xs text-muted-foreground">
              Exact JSON request body sent to the model API
            </div>
            <div className="flex-1 min-h-0">
              {rawPayload ? (
                <JsonEditorViewer
                  data={rawPayload}
                  title={`Request Payload: ${currentSpan.model}`}
                  maxHeight="max-h-[calc(85vh-200px)]"
                />
              ) : (
                <div className="py-24 text-center text-muted-foreground text-xs italic">
                  No request payload recorded.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── TAB 4: RESPONSE (Full JSON) ── */}
          <TabsContent value="response" className="flex-1 overflow-hidden mt-4 flex flex-col">
            <div className="mb-2 text-xs text-muted-foreground">
              Exact response JSON (or stream buffer) received from the model API
            </div>
            <div className="flex-1 min-h-0">
              {rawResponse ? (
                <JsonEditorViewer
                  data={rawResponse}
                  title={`API Response: ${currentSpan.model}`}
                  maxHeight="max-h-[calc(85vh-200px)]"
                />
              ) : (
                <div className="py-24 text-center text-muted-foreground text-xs italic">
                  No response recorded.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── TAB 5: TOOLS (Definitions & Calls) ── */}
          {(hasTools || toolDefs.length > 0) && (
            <TabsContent value="tools" className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4">
              {toolCalls.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Executed Tool Calls ({toolCalls.length})
                  </span>
                  {toolCalls.map((tc: any, i: number) => (
                    <div key={i} className="border rounded-md p-3 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2 font-mono text-sm font-semibold">
                        <Wrench className="h-4 w-4 text-amber-500" />
                        <span>{tc.function?.name || tc.name || 'Tool Call'}</span>
                      </div>
                      <JsonEditorViewer
                        data={safeParseJson(tc.function?.arguments || tc.arguments) ?? tc.function?.arguments ?? tc.arguments}
                        title={`Arguments`}
                        maxHeight="max-h-48"
                      />
                    </div>
                  ))}
                </div>
              )}

              {toolDefs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Available Tool Definitions ({toolDefs.length})
                  </span>
                  <JsonEditorViewer
                    data={toolDefs}
                    title="Tool Definitions Schema"
                    maxHeight="max-h-60"
                  />
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Pagination component ───────────────────────────────────────────────────────

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  const delta = 2;
  let prev = -1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      if (prev !== -1 && i - prev > 1) pages.push('...');
      pages.push(i);
      prev = i;
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── Main Traces Table Component ───────────────────────────────────────────────

export function TracesTableClient({
  events,
  traces,
  projectId,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  events?: any[];
  traces?: any[];
  projectId: string;
  fetchWaterfall?: (traceId: string) => Promise<any[]>;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}) {
  const [selectedSpan, setSelectedSpan] = useState<any>(null);
  const [conversationTarget, setConversationTarget] = useState<any>(null);

  const rows = traces ?? events ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No LLM traces found.</p>
        <p className="text-sm text-muted-foreground">Send a trace to see it here.</p>
      </div>
    );
  }

  const currentPage = page ?? 1;
  const totalPagesVal = totalPages ?? 1;

  const handleOpenConversationFromTrace = (span: any) => {
    setSelectedSpan(null);
    setConversationTarget(span);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Tokens (P/C/T)</TableHead>
              <TableHead>TTFT</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((event: any, i: number) => (
              <TableRow
                key={event.id || i}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setSelectedSpan(event)}
              >
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatRelativeTime(event.created_at || event.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline">{event.model}</Badge>
                    {event.provider && (
                      <span className="text-[10px] text-muted-foreground uppercase">{event.provider}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-28">
                  {event.user_id || event.userId || '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={event.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {event.template_name || event.templateName ? (
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      {event.template_name ?? event.templateName}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {event.prompt_tokens ?? event.promptTokens ?? 0} /{' '}
                  {event.completion_tokens ?? event.completionTokens ?? 0} /{' '}
                  <span className="font-medium">{event.total_tokens ?? event.totalTokens ?? 0}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">
                  {event.ttft_ms || event.ttftMs ? `${event.ttft_ms ?? event.ttftMs}ms` : '—'}
                </TableCell>
                <TableCell className="text-sm font-mono">{event.latency_ms ?? event.latencyMs ?? 0}ms</TableCell>
                <TableCell className="text-sm font-mono font-medium">${Number(event.cost ?? 0).toFixed(5)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {onPageChange && (
        <div className="flex items-center justify-between px-1 pt-3 text-xs text-muted-foreground">
          {total != null && (
            <span>
              {total.toLocaleString()} trace{total !== 1 ? 's' : ''} total
            </span>
          )}
          <Pagination page={currentPage} totalPages={totalPagesVal} onPageChange={onPageChange} />
        </div>
      )}

      {/* Detail Modal */}
      <TraceDialog
        trace={selectedSpan}
        projectId={projectId}
        open={Boolean(selectedSpan)}
        onClose={() => setSelectedSpan(null)}
        onOpenConversation={handleOpenConversationFromTrace}
      />

      {/* Conversation Thread Modal */}
      <ConversationModal
        projectId={projectId}
        sessionId={conversationTarget?.session_id || conversationTarget?.sessionId || ''}
        traceId={conversationTarget?.trace_id || conversationTarget?.traceId || ''}
        open={Boolean(conversationTarget)}
        onClose={() => setConversationTarget(null)}
      />
    </>
  );
}
