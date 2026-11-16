import { record } from "@rrweb/all";

(function (window) {
  /**
   * @param {object} opts
   * @param {string}   opts.project
   * @param {string}   opts.replayEndpoint
   * @param {string}   opts.replayMaskLevel    - 'strict' | 'moderate'
   * @param {number}   opts.replayMaxDuration  - ms
   * @param {string}   opts.replayBlockSelector
   * @param {Function} opts.getSession         - () => { cache, sessionId }
   */
  function startRecording(opts) {
    const {
      project,
      replayEndpoint,
      replayMaskLevel,
      replayMaxDuration,
      replayBlockSelector,
      getSession,
    } = opts;

    const getMaskConfig = (level) => {
      // By default, only mask inputs, don't mask all text on the page
      return { maskAllInputs: true }; 
    };

    const FLUSH_EVENT_COUNT = 50; // smaller batches so full snapshot isn't delayed
    const FLUSH_INTERVAL = 5000; // flush every 5s (was 10s)

    let replayBuffer = [];
    let replayStopFn = null;
    let replayFlushTimer = null;
    let replayStartTime = null;
    let replayStopped = false;
    let chunkIndex = 0; // track chunk number

    const sendReplayEvents = (events, useKeepalive = false) => {
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
        credentials: "omit",
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

    const beginReplay = () => {
      replayStartTime = Date.now();
      const maskConfig = getMaskConfig(replayMaskLevel);

      replayStopFn = record({
        emit(event) {
          if (replayStopped) return;
          if (Date.now() - replayStartTime > replayMaxDuration) {
            stopReplay();
            return;
          }
          replayBuffer.push(event);

          // Flush immediately after the full snapshot (event type 2) so the
          // snapshot is never delayed by the batch timer
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
  }

  window.__visionRecorder = { startRecording }; window.__sigmaRecorder = window.__visionRecorder;
})(window);
