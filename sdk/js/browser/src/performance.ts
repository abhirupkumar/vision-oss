export const initPerformanceTracking = (send: (payload: any, type: string) => void, getPayload: () => any) => {
  const metrics: Record<string, any> = {};
  let sent = false;
  let timeoutId: any;
  let isInitialLoad = true;
  let activationStart = 0;
  let pageStartTime = 0;

  const observe = (type: string, callback: (entry: any) => void) => {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch {
      /* not supported */
    }
  };

  // TTFB
  observe("navigation", (entry) => {
    activationStart = entry.activationStart || 0;
    metrics.ttfb = Math.max(entry.responseStart - activationStart, 0);
  });

  // FCP
  observe("paint", (entry) => {
    if (entry.name === "first-contentful-paint") {
      metrics.fcp = Math.max(entry.startTime - activationStart, 0);
    }
  });

  // LCP
  observe("largest-contentful-paint", (entry) => {
    metrics.lcp = Math.max(entry.startTime - activationStart, 0);
  });

  // CLS
  let clsSessionValue = 0;
  let clsSessionEntries: any[] = [];
  observe("layout-shift", (entry) => {
    if (!entry.hadRecentInput) {
      const lastEntry = clsSessionEntries[clsSessionEntries.length - 1];
      const firstEntry = clsSessionEntries[0];
      if (
        lastEntry &&
        entry.startTime - lastEntry.startTime - lastEntry.duration < 1000 &&
        entry.startTime - firstEntry.startTime < 5000
      ) {
        clsSessionValue += entry.value;
        clsSessionEntries.push(entry);
      } else {
        clsSessionValue = entry.value;
        clsSessionEntries = [entry];
      }
      if (clsSessionValue > (metrics.cls || 0)) {
        metrics.cls = clsSessionValue;
      }
    }
  });

  // INP
  let interactions: Record<string, number> = {};
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (entry.interactionId) {
          const existing = interactions[entry.interactionId];
          if (!existing || entry.duration > existing) {
            interactions[entry.interactionId] = entry.duration;
          }
          const values = Object.values(interactions).sort((a, b) => b - a);
          if (values.length) {
            const p98Index = Math.floor(Math.max(values.length, 10) * 0.02);
            metrics.inp = values[Math.min(p98Index, values.length - 1)];
          }
        }
      });
    });
    observer.observe({
      type: "event",
      buffered: true,
      durationThreshold: 40,
    } as any);
  } catch {
    /* not supported */
  }

  const sendPerformance = () => {
    if (sent) return;
    metrics.duration = Math.round(performance.now() - pageStartTime);
    sent = true;
    if (timeoutId) clearTimeout(timeoutId);
    send({ ...getPayload(), ...metrics }, "performance");
  };

  (window as any).__visionFlushPerformance = () => {
    sendPerformance();
    isInitialLoad = false;
    Object.keys(metrics).forEach((k) => {
      delete metrics[k];
    });
    activationStart = 0;
    pageStartTime = performance.now();
    clsSessionValue = 0;
    clsSessionEntries = [];
    interactions = {};
    sent = false;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(sendPerformance, 10000);
  };
  
  timeoutId = setTimeout(sendPerformance, 10000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendPerformance();
  });
  window.addEventListener("pagehide", sendPerformance);
};
