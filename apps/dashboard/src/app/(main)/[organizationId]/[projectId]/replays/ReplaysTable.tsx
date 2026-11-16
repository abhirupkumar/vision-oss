'use client';

import { Monitor, Play } from 'lucide-react';

function formatDuration(ms: number) {
  if (!ms || ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function ReplaysTable({
  data,
  onSelect,
}: {
  data: any[];
  onSelect?: (sessionId: string) => void;
}) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {data?.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No replays found
        </div>
      )}
      {data?.map((row: any) => (
        <div
          key={row.id}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 cursor-pointer"
          onClick={() => onSelect?.(row.id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(row.id); }}
        >
          {/* Play button */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
            <Play size={14} className="ml-0.5" />
          </div>

          {/* Session info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Monitor size={12} className="text-muted-foreground shrink-0" />
              <p className="truncate text-sm font-medium text-foreground">
                {row.browser || 'Unknown browser'}
                {row.os ? ` · ${row.os}` : ''}
                {row.device && row.device !== 'desktop' ? ` · ${row.device}` : ''}
              </p>
            </div>
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {row.country ? `${row.country}${row.city ? `, ${row.city}` : ''} · ` : ''}
              {new Date(row.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs font-medium text-foreground">{formatDuration(row.duration)}</p>
              <p className="text-xs text-muted-foreground">{row.eventCount ?? 0} events</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
