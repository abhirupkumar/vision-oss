import { state, getSession } from './core';

export const initReplay = () => {
  const opts = state.options;
  if (!opts) return;

  const project = opts.projectId;
  const replayEndpoint = state.replayEndpoint;
  const replayMaskLevel = opts.replayMaskLevel || 'moderate';
  const replayMaxDuration = opts.replayMaxDuration || 1000 * 60 * 30; // 30 min default
  const replayBlockSelector = opts.replayBlockSelector;
  const sampleRate = opts.replaySampleRate !== undefined ? opts.replaySampleRate : 1.0;

  if (Math.random() > sampleRate) {
    return; // user not sampled for session replay
  }

  const getMaskConfig = (_level: string) => {
    return { maskAllInputs: true };
  };

  const FLUSH_EVENT_COUNT = 50;
  const FLUSH_INTERVAL = 5000;

  let replayBuffer: any[] = [];
  let replayStopFn: Function | null = null;
  let replayFlushTimer: any = null;
  let replayStartTime: number | null = null;
  let replayStopped = false;
  let chunkIndex = 0;

  const sendReplayEvents = (events: any[], useKeepalive = false) => {
    const session = getSession();
    if (!session?.cache) return;

    const body = JSON.stringify({
      type: "record",
      payload: {
        project,
        events,
        chunkIndex,
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    chunkIndex++;

    const keepalive = useKeepalive && body.length < 60000;
    fetch(replayEndpoint, {
      keepalive,
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-vision-cache": session.cache,
      },
      credentials: opts.fetchCredentials || "omit",
    }).catch(() => {});
  };

  const flushReplay = (useKeepalive = false) => {
    if (!replayBuffer.length) return;
    const events = replayBuffer;
    replayBuffer = [];
    sendReplayEvents(events, useKeepalive);
  };

  const scheduleReplayFlush = () => {
    if (replayFlushTimer) clearTimeout(replayFlushTimer);
    replayFlushTimer = setTimeout(flushReplay, FLUSH_INTERVAL);
  };

  const stopReplay = () => {
    if (replayStopped) return;
    replayStopped = true;
    if (replayFlushTimer) clearTimeout(replayFlushTimer);
    flushReplay();
    if (replayStopFn) replayStopFn();
  };

  const beginReplay = async () => {
    replayStartTime = Date.now();
    const maskConfig = getMaskConfig(replayMaskLevel);

    // Dynamic import for code-splitting
    let rrweb: any;
    try {
      rrweb = await import('@rrweb/all');
    } catch (e) {
      console.warn('Vision: Failed to load rrweb for session replay', e);
      return;
    }
    
    const { record } = rrweb;

    replayStopFn = record({
      emit(event: any) {
        if (replayStopped) return;
        if (Date.now() - (replayStartTime || 0) > replayMaxDuration) {
          stopReplay();
          return;
        }
        replayBuffer.push(event);

        if (event.type === 2) {
          flushReplay();
          return;
        }

        if (replayBuffer.length >= FLUSH_EVENT_COUNT) flushReplay();
        scheduleReplayFlush();
      },
      ...maskConfig,
      recordCanvas: false,
      recordCrossOriginIframes: false,
      checkoutEveryNms: 30000,
      slimDOMOptions: {
        script: true,
        comment: true,
        headMetaDescKeywords: true,
        headMetaSocial: true,
        headMetaRobots: true,
        headMetaHttpEquiv: true,
        headMetaAuthorship: true,
        headMetaVerification: true,
      },
      ...(replayBlockSelector && { blockSelector: replayBlockSelector }),
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushReplay(true);
    });
    window.addEventListener("beforeunload", () => flushReplay(true));
  };

  const waitForReplaySession = (attempts = 0) => {
    if (attempts > 50) return;
    const session = getSession();
    if (session?.cache) {
      beginReplay();
    } else {
      setTimeout(() => waitForReplaySession(attempts + 1), 100);
    }
  };

  waitForReplaySession();
};
