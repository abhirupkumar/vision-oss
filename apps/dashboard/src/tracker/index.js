((window) => {
  const {
    screen: { width, height },
    navigator: { language, doNotTrack: ndnt, msDoNotTrack: msdnt },
    location,
    document,
    history,
    top,
    doNotTrack,
  } = window;
  const currentScript =
    document.currentScript || document.querySelector("script[data-project-id]");
  const { referrer } = document;
  if (!currentScript) return;

  const { hostname, href, origin } = location;

  let localStorage;
  try {
    localStorage = href.startsWith("data:") ? undefined : window.localStorage;
  } catch {
    /* (DOMException) SecurityError: Access is denied for this document. */
  }

  const _data = "data-";
  const _false = "false";
  const _true = "true";
  const attr = currentScript.getAttribute.bind(currentScript);
  const config = (value) => attr(`${_data}${value}`);

  const project = config("project-id");
  const deviceId = config("device-id") || null;
  const hostUrl = config("host-url");
  const beforeSend = config("before-send");
  const tag = config("tag") || undefined;
  const autoTrack = config("auto-track") !== _false;
  const dnt = config("do-not-track") === _true;
  const excludeSearch = config("exclude-search") === _true;
  const excludeHash = config("exclude-hash") === _true;
  const domain = config("domains") || "";
  const credentials = config("fetch-credentials") || "omit";
  const perf = config("performance") === _true;
  const errs = config("errors") !== _false; // enabled by default unless data-errors="false"
  const sessionReplay = config("session-replay") === _true; // disabled by default — enable with data-session-replay="true"
  const replaySampleRate = parseFloat(config("replay-sample-rate") || "0.15");
  const replayMaskLevel = config("replay-mask-level") || "moderate";
  const replayMaxDuration = parseInt(
    config("replay-max-duration") || "300000",
    10,
  );
  const replayBlockSelector = config("replay-block-selector") || "";

  const domains = domain.split(",").map((n) => n.trim());
  const host =
    hostUrl ||
    "__COLLECT_API_HOST__" ||
    currentScript.src.split("/").slice(0, -1).join("/");
  const endpoint = `${host.replace(/\/$/, "")}__COLLECT_API_ENDPOINT__`;
  const replayEndpoint = `${host.replace(
    /\/$/,
    "",
  )}__COLLECT_REPLAY_ENDPOINT__`;
  const screen = `${width}x${height}`;
  const eventRegex = /data-vision-event-([\w-_]+)/;
  const eventNameAttribute = `${_data}sigma-event`;
  const delayDuration = 300;

  /* Helper functions */

  const normalize = (raw) => {
    if (!raw) return raw;
    try {
      const u = new URL(raw, location.href);
      if (excludeSearch) u.search = "";
      if (excludeHash) u.hash = "";
      return u.toString();
    } catch {
      return raw;
    }
  };

  const getPayload = () => ({
    project,
    screen,
    language,
    title: document.title,
    hostname,
    url: currentUrl,
    referrer: currentRef,
    tag,
    id: identity ? identity : undefined,
  });

  const hasDoNotTrack = () => {
    const dnt = doNotTrack || ndnt || msdnt;
    return dnt === 1 || dnt === "1" || dnt === "yes";
  };

  /* Event handlers */

  const handlePush = (_state, _title, url) => {
    if (!url) return;

    if (typeof flushPerformance === "function") {
      flushPerformance();
    }

    currentRef = currentUrl;
    currentUrl = normalize(new URL(url, location.href).toString());

    if (currentUrl !== currentRef) {
      setTimeout(track, delayDuration);
    }
  };

  const handlePathChanges = () => {
    const hook = (_this, method, callback) => {
      const orig = _this[method];
      return (...args) => {
        callback.apply(null, args);
        return orig.apply(_this, args);
      };
    };

    history.pushState = hook(history, "pushState", handlePush);
    history.replaceState = hook(history, "replaceState", handlePush);
  };

  const isElementIgnored = (el) => {
    if (!el) return true;
    if (typeof el.getAttribute !== "function") return false;
    if (
      el.getAttribute("data-vision-ignore") !== null ||
      el.getAttribute("data-private") !== null
    ) {
      return true;
    }
    if (
      el.tagName === "INPUT" &&
      el.getAttribute("type")?.toLowerCase() === "password"
    ) {
      return true;
    }
    return false;
  };

  const getElementLabel = (el) => {
    if (!el) return "";
    const raw =
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.getAttribute("placeholder") ||
      el.innerText ||
      el.textContent ||
      el.getAttribute("name") ||
      el.id ||
      "";
    return raw.trim().replace(/\s+/g, " ").slice(0, 100);
  };

  const handleClicks = () => {
    const trackElement = async (el) => {
      const eventName = el.getAttribute(eventNameAttribute);
      if (eventName) {
        const eventData = {};

        el.getAttributeNames().forEach((name) => {
          const match = name.match(eventRegex);
          if (match) eventData[match[1]] = el.getAttribute(name);
        });

        return track(eventName, eventData);
      }
    };

    const onClick = async (e) => {
      const el = e.target;
      if (!el) return;

      // 1. Explicit data-vision-event has highest priority
      const taggedEl = el.closest
        ? el.closest(`[${eventNameAttribute}]`)
        : null;
      if (taggedEl) {
        const { href, target } = taggedEl;
        if (taggedEl.tagName === "A" && href) {
          const external =
            target === "_blank" ||
            e.ctrlKey ||
            e.shiftKey ||
            e.metaKey ||
            (e.button && e.button === 1);
          if (!external) e.preventDefault();
          return trackElement(taggedEl).then(() => {
            if (!external) {
              (target === "_top" ? top.location : location).href = href;
            }
          });
        }
        return trackElement(taggedEl);
      }

      const interactiveEl = el.closest
        ? el.closest(
            "button, a, textarea, input, label, select, form, [role='button']",
          )
        : null;
      const targetEl = interactiveEl || (el.tagName === "P" ? el : null);

      if (!targetEl || isElementIgnored(targetEl)) return;

      const tag = targetEl.tagName.toLowerCase();
      const text = getElementLabel(targetEl);
      const id = targetEl.id || undefined;
      const className =
        typeof targetEl.className === "string" && targetEl.className
          ? targetEl.className.slice(0, 100)
          : undefined;
      const name = targetEl.getAttribute("name") || undefined;
      const type = targetEl.getAttribute("type") || undefined;
      const href =
        targetEl.tagName === "A" ? targetEl.getAttribute("href") : undefined;
      const action =
        targetEl.tagName === "FORM"
          ? targetEl.getAttribute("action")
          : undefined;

      const eventData = {
        event_type: "click",
        tag,
        ...(text && { text }),
        ...(id && { id }),
        ...(className && { class: className }),
        ...(name && { name }),
        ...(type && { type }),
        ...(href && { href }),
        ...(action && { action }),
      };

      if (targetEl.tagName === "A" && href) {
        const external =
          targetEl.target === "_blank" ||
          e.ctrlKey ||
          e.shiftKey ||
          e.metaKey ||
          (e.button && e.button === 1);
        if (!external) e.preventDefault();
        return track("$autocapture", eventData).then(() => {
          if (!external) {
            (targetEl.target === "_top" ? top.location : location).href = href;
          }
        });
      }

      return track("$autocapture", eventData);
    };

    document.addEventListener("click", onClick, true);
  };

  const initAutocapture = () => {
    // Form submissions
    const onSubmit = (e) => {
      const form = e.target;
      if (!form || form.tagName !== "FORM" || isElementIgnored(form)) return;
      track("$autocapture", {
        event_type: "submit",
        tag: "form",
        form_id: form.id || undefined,
        form_name: form.getAttribute("name") || undefined,
        action: form.getAttribute("action") || undefined,
        method: (form.getAttribute("method") || "get").toUpperCase(),
        element_count: form.elements ? form.elements.length : undefined,
      });
    };

    // Input value changes (select, checkbox, radio, input, textarea)
    const onChange = (e) => {
      const el = e.target;
      if (!el || isElementIgnored(el)) return;
      const tag = el.tagName.toLowerCase();
      if (tag !== "input" && tag !== "select" && tag !== "textarea") return;

      const data = {
        event_type: "change",
        tag,
        input_name: el.getAttribute("name") || undefined,
        input_id: el.id || undefined,
        input_type: el.getAttribute("type") || undefined,
      };

      if (tag === "select") {
        const selectedOption =
          el.options && el.selectedIndex >= 0
            ? el.options[el.selectedIndex]
            : null;
        if (selectedOption) {
          data.selected_text = (selectedOption.text || "").trim().slice(0, 50);
        }
      } else if (el.type === "checkbox" || el.type === "radio") {
        data.checked = el.checked;
      } else {
        data.has_value = Boolean(el.value);
        data.value_length = el.value ? el.value.length : 0;
      }

      track("$autocapture", data);
    };

    // Content edits (contenteditable="true")
    const onContentEdit = (e) => {
      const el = e.target;
      if (!el || isElementIgnored(el)) return;
      if (
        el.isContentEditable ||
        el.getAttribute("contenteditable") === "true"
      ) {
        const text = (el.innerText || el.textContent || "").trim();
        track("$autocapture", {
          event_type: "content_edit",
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          class:
            typeof el.className === "string" && el.className
              ? el.className.slice(0, 100)
              : undefined,
          content_length: text.length,
          snippet: text.slice(0, 50),
        });
      }
    };

    // Clipboard copies
    const onCopy = (e) => {
      const target = e.target;
      if (isElementIgnored(target)) return;

      let selectedText = "";
      try {
        if (
          target &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
        ) {
          const start = target.selectionStart;
          const end = target.selectionEnd;
          if (
            typeof start === "number" &&
            typeof end === "number" &&
            end > start
          ) {
            selectedText = target.value.substring(start, end);
          }
        }
        if (!selectedText) {
          const sel =
            (typeof window !== "undefined" &&
              window.getSelection &&
              window.getSelection()) ||
            (typeof document !== "undefined" &&
              document.getSelection &&
              document.getSelection());
          selectedText = (sel ? sel.toString() : "").trim();
        }
      } catch {}

      if (!selectedText) return;

      track("$autocapture", {
        event_type: "copy",
        target_tag: target?.tagName ? target.tagName.toLowerCase() : undefined,
        target_id: target?.id || undefined,
        selection_length: selectedText.length,
        selected_text: selectedText.slice(0, 100),
      });
    };

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("change", onChange, true);
    document.addEventListener("blur", onContentEdit, true);
    document.addEventListener("copy", onCopy, true);
  };

  /* Tracking functions */

  const trackingDisabled = () =>
    disabled ||
    !project ||
    localStorage?.getItem("sigma.disabled") ||
    (domain && !domains.includes(hostname)) ||
    (dnt && hasDoNotTrack());

  const send = async (payload, type = "event") => {
    if (trackingDisabled()) return;

    const callback = window[beforeSend];

    if (typeof callback === "function") {
      payload = await Promise.resolve(callback(type, payload));
    }

    if (!payload) return;

    try {
      const targetEndpoint =
        type === "error" ? endpoint.replace(/\/send$/, "/errors") : endpoint;
      console.log(
        `[Vision Tracker] Sending payload of type '${type}' to:`,
        targetEndpoint,
      );
      const res = await fetch(targetEndpoint, {
        keepalive: true,
        method: "POST",
        body: JSON.stringify({ type, payload }),
        headers: {
          "Content-Type": "application/json",
          ...(typeof cache !== "undefined" && { "x-vision-cache": cache }),
        },
        credentials,
      });

      const data = await res.json();
      if (data) {
        disabled = !!data.disabled;
        cache = data.cache;
        if (data.sessionId) sessionId = data.sessionId;
        if (data.visitorId) {
          visitorId = data.visitorId;
          if (window.vision) window.vision.visitorId = data.visitorId;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      /* no-op */
    }
  };

  const init = () => {
    if (!initialized) {
      initialized = true;
      track();
      handlePathChanges();
      handleClicks();
      initAutocapture();
      if (perf) initPerformance();
      if (errs) initErrors();
      if (sessionReplay) initReplay();
    }
  };

  const track = (name, data) => {
    if (typeof name === "string") return send({ ...getPayload(), name, data });
    if (typeof name === "object") return send({ ...name });
    if (typeof name === "function") return send(name(getPayload()));
    return send(getPayload());
  };

  const storageIdentityKey = project ? `vision.identity.${project}` : "vision.identity";
  const storageIdentifiedKey = project ? `vision.is_identified.${project}` : "vision.is_identified";

  const identify = (id, data) => {
    const previousVisitorId = visitorId;
    const wasIdentified = isIdentified;

    let nextId;
    if (typeof id === "string") {
      nextId = id;
    } else if (typeof id === "object" && id && typeof id.id === "string") {
      nextId = id.id;
    }

    if (nextId) {
      identity = nextId;
      isIdentified = true;
      try {
        localStorage?.setItem(storageIdentityKey, nextId);
        localStorage?.setItem(storageIdentifiedKey, "true");
      } catch {}
    }

    cache = "";
    // Only pass anonId if previous visitor was anonymous (guardrail against merging two identified users)
    const anonId =
      !wasIdentified && previousVisitorId && previousVisitorId !== identity
        ? previousVisitorId
        : undefined;

    return send(
      {
        ...getPayload(),
        anonId,
        data: typeof id === "object" ? id : data,
      },
      "identify",
    );
  };

  const reset = () => {
    identity = undefined;
    isIdentified = false;
    cache = "";
    visitorId = null;
    sessionId = undefined;
    if (window.vision) {
      window.vision.visitorId = null;
    }
    try {
      localStorage?.removeItem(storageIdentityKey);
      localStorage?.removeItem(storageIdentifiedKey);
    } catch {}
  };

  /* Performance */

  const initPerformance = () => {
    const metrics = {};
    let sent = false;
    let timeoutId;
    let isInitialLoad = true;
    let activationStart = 0;
    let pageStartTime = 0;

    const observe = (type, callback) => {
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

    // CLS - session windows algorithm (gap < 1s, max 5s duration; report worst window)
    let clsSessionValue = 0;
    let clsSessionEntries = [];
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

    // INP - group by interactionId, 98th percentile, 40ms threshold
    let interactions = {};
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
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
      });
    } catch {
      /* not supported */
    }

    const getEntriesByType = (type) => {
      try {
        return window.performance?.getEntriesByType?.(type) || [];
      } catch {
        return [];
      }
    };

    const applyFallbackMetrics = () => {
      if (!isInitialLoad) return;

      if (metrics.ttfb === undefined) {
        const navigation = getEntriesByType("navigation")?.[0];
        if (navigation) {
          metrics.ttfb = Math.max(
            navigation.responseStart - (navigation.activationStart || 0),
            0,
          );
        }
      }

      if (metrics.fcp === undefined) {
        const fcpEntry = getEntriesByType("paint")?.find(
          (entry) => entry.name === "first-contentful-paint",
        );
        if (fcpEntry) {
          metrics.fcp = Math.max(fcpEntry.startTime - activationStart, 0);
        }
      }

      if (metrics.lcp === undefined) {
        const lcpEntries = getEntriesByType("largest-contentful-paint");
        const lcpEntry = lcpEntries?.[lcpEntries.length - 1];
        if (lcpEntry) {
          metrics.lcp = Math.max(lcpEntry.startTime - activationStart, 0);
        }
      }
    };

    const sendPerformance = () => {
      if (sent) return;

      applyFallbackMetrics();
      metrics.duration = Math.round(performance.now() - pageStartTime);

      sent = true;
      if (timeoutId) clearTimeout(timeoutId);
      send({ ...getPayload(), ...metrics }, "performance");
    };

    flushPerformance = () => {
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

  /* Errors */

  const initErrors = () => {
    window.addEventListener("error", (event) => {
      send(
        {
          ...getPayload(),
          errorType: (event.error && event.error.name) || "Error",
          message:
            event.message ||
            (event.error && event.error.message) ||
            String(event),
          stack: event.error ? event.error.stack : undefined,
          timestamp: Date.now(),
          level: "error",
        },
        "error",
      );
    });

    window.addEventListener("unhandledrejection", (event) => {
      send(
        {
          ...getPayload(),
          errorType: event.reason
            ? event.reason.name || "UnhandledRejection"
            : "UnhandledRejection",
          message: event.reason
            ? event.reason.message || String(event.reason)
            : "Promise rejection",
          stack: event.reason ? event.reason.stack : undefined,
          timestamp: Date.now(),
          level: "error",
        },
        "error",
      );
    });
  };

  /* Session Replay */

  const initReplay = () => {
    if (replaySampleRate < 1 && Math.random() > replaySampleRate) return;

    const scriptSrc = currentScript.src;
    let recorderSrc = scriptSrc;
    try {
      const url = new URL(scriptSrc);
      const pathParts = url.pathname.split("/");
      pathParts[pathParts.length - 1] = "recorder.js";
      url.pathname = pathParts.join("/");
      recorderSrc = url.toString();
    } catch {
      recorderSrc = scriptSrc.replace(/\/[^\/]+(\?.*)?$/, "/recorder.js$1");
    }

    const onRecorderLoaded = () => {
      if (!window.__visionRecorder) return;
      window.__visionRecorder.startRecording({
        project,
        replayEndpoint,
        replayMaskLevel,
        replayMaxDuration,
        replayBlockSelector,
        getSession: () => window.vision?.getSession?.(),
      });
    };

    const script = document.createElement("script");
    script.src = recorderSrc;
    script.async = true;
    script.onload = onRecorderLoaded;
    document.head.appendChild(script);
  };

  /* Start */

  const abTest = async (testId, variants) => {
    if (trackingDisabled()) return null;
    const storageKey = `vision_ab_${testId}`;
    let assigned;
    try {
      const stored = localStorage?.getItem(storageKey);
      assigned = stored ? JSON.parse(stored) : null;
    } catch (_) {
      assigned = null;
    }

    if (!assigned) {
      const total = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
      let rand = Math.random() * total;
      for (const v of variants) {
        rand -= v.weight || 1;
        if (rand <= 0) {
          assigned = v;
          break;
        }
      }
      if (!assigned) assigned = variants[0];
      try {
        localStorage?.setItem(storageKey, JSON.stringify(assigned));
      } catch (_) {}

      if (sessionId && assigned?.id) {
        fetch(`/api/projects/${project}/ab-tests/${testId}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "assign",
            variantId: assigned.id,
            sessionId,
          }),
        }).catch(() => {});
      }
    }
    return assigned;
  };

  const abConvert = (testId) => {
    if (trackingDisabled() || !sessionId) return;
    fetch(`/api/projects/${project}/ab-tests/${testId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "convert", sessionId }),
    }).catch(() => {});
  };

  let currentUrl = normalize(href);
  let currentRef = normalize(referrer.startsWith(origin) ? "" : referrer);

  let initialized = false;
  let disabled = false;
  let cache;
  let sessionId;
  let identity = localStorage?.getItem(storageIdentityKey) || undefined;
  let isIdentified = localStorage?.getItem(storageIdentifiedKey) === "true";
  let visitorId = null;
  let flushPerformance;

  const visionApi = {
    track,
    identify,
    reset,
    getSession: () => ({ cache, project, sessionId }),
    getIds: () => ({
      sessionId,
      visitorId: visitorId || identity || null,
      deviceId:
        window.vision?.deviceId !== undefined ? window.vision.deviceId : deviceId,
    }),
    abTest,
    abConvert,
    visitorId: null,
    deviceId: deviceId, // string or null, never undefined
  };

  if (!window.vision) {
    window.vision = sigmaApi;
  } else {
    Object.assign(window.vision, {
      track: window.vision.track || track,
      identify: window.vision.identify || identify,
      reset: window.vision.reset || reset,
      getSession: window.vision.getSession || sigmaApi.getSession,
      getIds: window.vision.getIds || sigmaApi.getIds,
      abTest: window.vision.abTest || abTest,
      abConvert: window.vision.abConvert || abConvert,
    });
    if (window.vision.deviceId === undefined) {
      window.vision.deviceId = deviceId;
    }
    if (window.vision.visitorId === undefined) {
      window.vision.visitorId = null;
    }
  }

  if (autoTrack && !trackingDisabled()) {
    if (document.readyState === "complete") {
      init();
    } else {
      document.addEventListener("readystatechange", init, true);
    }
  }
})(window);
