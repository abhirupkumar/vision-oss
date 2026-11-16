'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Replayer } from '@rrweb/all';
import '@rrweb/all/dist/style.css';

function formatTime(ms: number) {
  if (!ms || ms < 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// rrweb EventType enum (v2 alpha)
const EVENT_TYPES: Record<number, string> = {
  0: 'DomContentLoaded',
  1: 'Load',
  2: 'FullSnapshot',
  3: 'IncrementalSnapshot',
  4: 'Meta',
  5: 'Custom',
  6: 'Plugin',
};

export function ReplayPlayer({ chunks }: { chunks: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const replayerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Flatten + sort all events by timestamp (memoized so it doesn't run 60 times a second)
  const allEvents = useMemo(() => (chunks ?? [])
    .flatMap((c: any) => c.events || [])
    .sort((a: any, b: any) => (a.timestamp ?? 0) - (b.timestamp ?? 0)), [chunks]);

  const scaleReplayer = () => {
    const container = containerRef.current;
    if (!container) return;
    const wrapper = container.querySelector('.replayer-wrapper') as HTMLElement;
    const iframe = container.querySelector('iframe');
    if (!wrapper || !iframe) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const iw = iframe.offsetWidth || parseInt(String(iframe.getAttribute('width') || '1280'));
    const ih = iframe.offsetHeight || parseInt(String(iframe.getAttribute('height') || '720'));
    if (!iw || !ih) return;
    const scale = Math.min(cw / iw, ch / ih);

    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.marginLeft = `${(cw - iw * scale) / 2}px`;
    wrapper.style.marginTop = `${(ch - ih * scale) / 2}px`;
  };

  useEffect(() => {
    if (!allEvents.length || !containerRef.current) return;

    // Debug: log event type distribution
    const typeCounts: Record<string, number> = {};
    allEvents.forEach((e: any) => {
      const label = EVENT_TYPES[e.type] ?? `type${e.type}`;
      typeCounts[label] = (typeCounts[label] ?? 0) + 1;
    });
    const debugStr = Object.entries(typeCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    setDebugInfo(`${allEvents.length} events — ${debugStr}`);

    // Destroy previous instance
    if (replayerRef.current) {
      try { replayerRef.current.destroy?.(); } catch { }
      replayerRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    containerRef.current.innerHTML = '';
    setReady(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);

    const firstTs = allEvents[0]?.timestamp ?? 0;
    const lastTs = allEvents[allEvents.length - 1]?.timestamp ?? 0;
    const duration = Math.max(0, lastTs - firstTs);
    setTotalTime(duration);

    // Check for FullSnapshot
    const hasFullSnapshot = allEvents.some((e: any) => e.type === 2);
    if (!hasFullSnapshot) {
      setError('Recording is missing the initial page snapshot (FullSnapshot). Re-record the session with the updated tracker script.');
      return;
    }

    try {
      const replayer = new Replayer(allEvents, {
        root: containerRef.current!,
      });
      replayerRef.current = replayer;

      replayer.on('finish', () => {
        setIsPlaying(false);
        setCurrentTime(duration);
      });

      // pause(0) renders the first frame without playing
      replayer.pause(0);

      // Scale after iframe is populated
      setTimeout(() => {
        scaleReplayer();
        setReady(true);
      }, 500);

      // Poll current time
      const tick = () => {
        if (!replayerRef.current) return;
        try {
          const t = replayerRef.current.getCurrentTime?.() ?? 0;
          setCurrentTime(Math.max(0, t));
        } catch { }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      console.error('[ReplayPlayer] Init error:', e);
      setError(`Replayer error: ${e?.message ?? 'unknown'}`);
    }

    window.addEventListener('resize', scaleReplayer);
    return () => {
      window.removeEventListener('resize', scaleReplayer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (replayerRef.current) {
        try { replayerRef.current.destroy?.(); } catch { }
        replayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks]);

  const handlePlayPause = () => {
    if (!replayerRef.current || !ready) return;
    if (isPlaying) {
      replayerRef.current.pause();
      setIsPlaying(false);
    } else {
      replayerRef.current.play(currentTime);
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!replayerRef.current || !ready) return;
    replayerRef.current.play(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeekBack = () => {
    if (!replayerRef.current || !ready) return;
    const t = Math.max(0, currentTime - 10000);
    replayerRef.current.play(t);
    setCurrentTime(t);
    setIsPlaying(true);
  };

  const handleSeekForward = () => {
    if (!replayerRef.current || !ready) return;
    const t = Math.min(totalTime, currentTime + 10000);
    replayerRef.current.play(t);
    setCurrentTime(t);
    setIsPlaying(true);
  };

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
    replayerRef.current?.setConfig({ speed: s });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replayerRef.current || !ready) return;
    const t = Number(e.target.value);
    setCurrentTime(t);
    const wasPlaying = isPlaying;
    replayerRef.current.pause();
    replayerRef.current.play(t);
    if (!wasPlaying) {
      setTimeout(() => { replayerRef.current?.pause(); setIsPlaying(false); }, 80);
    } else {
      setIsPlaying(true);
    }
  };

  const progress = totalTime > 0 ? Math.min(100, (currentTime / totalTime) * 100) : 0;

  if (!allEvents.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-64 text-muted-foreground text-sm">
        <p>No replay data available</p>
        <p className="text-xs opacity-60">Make sure the tracker has <code>data-session-replay="true"</code></p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-white"
        style={{ aspectRatio: '16/9' }}
      >
        <div ref={containerRef} className="absolute inset-0 overflow-hidden" />

        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/60 text-muted-foreground text-sm z-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading replay…</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 z-10 p-6 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Debug info (only in dev) */}
      {process.env.NODE_ENV !== 'production' && debugInfo && (
        <p className="text-[10px] text-muted-foreground font-mono px-1 opacity-60 truncate">{debugInfo}</p>
      )}

      {/* Controls */}
      {!error && (
        <div className="flex flex-col gap-2">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums text-muted-foreground w-10 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 h-3 flex items-center group">
              <input
                type="range"
                min={0}
                max={totalTime || 100}
                step={100}
                value={Math.min(currentTime, totalTime || 0)}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-10 shrink-0">
              {formatTime(totalTime)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button onClick={handleRestart} disabled={!ready}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                title="Restart">
                <RotateCcw size={13} />
              </button>
              <button onClick={handleSeekBack} disabled={!ready}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                title="−10s">
                <SkipBack size={13} />
              </button>
              <button onClick={handlePlayPause} disabled={!ready}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 shadow-sm"
                title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>
              <button onClick={handleSeekForward} disabled={!ready}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40 transition-colors"
                title="+10s">
                <SkipForward size={13} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Speed</span>
              {[0.5, 1, 2, 4].map(s => (
                <button key={s} onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${speed === s ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'
                    }`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
