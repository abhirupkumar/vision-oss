import { state } from './core';

export const initPageviewTracking = (normalize: (url: string) => string, track: () => void) => {
  const delayDuration = 300;

  const handlePush = (_state: any, _title: string, url?: string | URL | null) => {
    if (!url) return;

    if (typeof (window as any).__visionFlushPerformance === "function") {
      (window as any).__visionFlushPerformance();
    }

    state.currentRef = state.currentUrl;
    state.currentUrl = normalize(new URL(url.toString(), window.location.href).toString());

    if (state.currentUrl !== state.currentRef) {
      setTimeout(track, delayDuration);
    }
  };

  const hook = (_this: any, method: string, callback: Function) => {
    const orig = _this[method];
    return (...args: any[]) => {
      callback.apply(null, args);
      return orig.apply(_this, args);
    };
  };

  window.history.pushState = hook(window.history, "pushState", handlePush);
  window.history.replaceState = hook(window.history, "replaceState", handlePush);
};
