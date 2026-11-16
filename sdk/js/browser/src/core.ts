import { initPageviewTracking } from './pageview';
import { initClicksTracking } from './clicks';
import { initPerformanceTracking } from './performance';
import { initErrorsTracking } from './errors';
import { initReplay } from './replay';
import { initAbTests, abConvertCall } from './abtests';
import { initAutocapture } from './autocapture';

export type SigmaInitOptions = VisionInitOptions;
export interface VisionInitOptions {
  projectId: string;
  hostUrl?: string;
  autoTrack?: boolean;
  autocapture?: boolean;
  performance?: boolean;
  errors?: boolean;
  sessionReplay?: boolean;
  replaySampleRate?: number;
  replayMaskLevel?: 'strict' | 'moderate';
  replayMaxDuration?: number;
  replayBlockSelector?: string;
  beforeSend?: (type: string, payload: any) => any | Promise<any>;
  tag?: string;
  doNotTrack?: boolean;
  excludeSearch?: boolean;
  excludeHash?: boolean;
  deviceId?: string | null;
  domains?: string[];
  fetchCredentials?: 'omit' | 'same-origin' | 'include';
}

export const state = {
  options: null as VisionInitOptions | null,
  initialized: false,
  disabled: false,
  cache: undefined as string | undefined,
  sessionId: undefined as string | undefined,
  identity: undefined as string | undefined,
  isIdentified: false,
  visitorId: null as string | null,
  deviceId: null as string | null,
  currentUrl: '',
  currentRef: '',
  endpoint: '',
  replayEndpoint: ''
};

const normalize = (raw: string) => {
  if (!raw || typeof window === 'undefined') return raw;
  try {
    const u = new URL(raw, window.location.href);
    if (state.options?.excludeSearch) u.search = "";
    if (state.options?.excludeHash) u.hash = "";
    return u.toString();
  } catch {
    return raw;
  }
};

export const getPayload = () => {
  if (typeof window === 'undefined') return {};
  const { width, height } = window.screen;
  return {
    project: state.options?.projectId,
    screen: `${width}x${height}`,
    language: window.navigator.language,
    title: window.document.title,
    hostname: window.location.hostname,
    url: state.currentUrl,
    referrer: state.currentRef,
    tag: state.options?.tag,
    id: state.identity ? state.identity : undefined,
  };
};

const hasDoNotTrack = () => {
  if (typeof window === 'undefined') return false;
  const dnt = (window as any).doNotTrack || window.navigator.doNotTrack || (window.navigator as any).msDoNotTrack;
  return dnt === 1 || dnt === "1" || dnt === "yes";
};

const trackingDisabled = () => {
  if (typeof window === 'undefined') return true;
  return state.disabled ||
    !state.options?.projectId ||
    (window.localStorage && window.localStorage.getItem("vision.disabled")) ||
    (state.options?.domains && state.options.domains.length > 0 && !state.options.domains.includes(window.location.hostname)) ||
    (state.options?.doNotTrack && hasDoNotTrack());
};

export const send = async (payload: any, type = "event") => {
  if (trackingDisabled()) return;

  if (typeof state.options?.beforeSend === "function") {
    payload = await Promise.resolve(state.options.beforeSend(type, payload));
  }

  if (!payload) return;

  try {
    const targetEndpoint = type === "error" ? state.endpoint.replace(/\/send$/, "/errors") : state.endpoint;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (state.cache) {
      headers["x-vision-cache"] = state.cache;
    }

    const res = await fetch(targetEndpoint, {
      keepalive: true,
      method: "POST",
      body: JSON.stringify({ type, payload }),
      headers,
      credentials: state.options?.fetchCredentials || "omit",
    });

    const data = await res.json();
    if (data) {
      state.disabled = !!data.disabled;
      state.cache = data.cache;
      if (data.sessionId) state.sessionId = data.sessionId;
      if (data.visitorId) {
        state.visitorId = data.visitorId;
        if (typeof window !== 'undefined' && (window as any).vision) {
          (window as any).vision.visitorId = data.visitorId;
        }
      }
    }
  } catch (_e) {
    /* no-op */
  }
};

export const track = (name?: string | object | Function, data?: any) => {
  if (typeof name === "string") return send({ ...getPayload(), name, data });
  if (typeof name === "object") return send({ ...name });
  if (typeof name === "function") return send(name(getPayload()));
  return send(getPayload());
};

export const identify = (id: string | object, data?: any) => {
  const previousVisitorId = state.visitorId;
  const wasIdentified = state.isIdentified;

  let nextId: string | undefined;
  if (typeof id === "string") {
    nextId = id;
  } else if (typeof id === "object" && id && "id" in id && typeof (id as any).id === "string") {
    nextId = (id as any).id;
  }

  if (nextId) {
    state.identity = nextId;
    state.isIdentified = true;
    if (typeof window !== 'undefined' && state.options?.projectId) {
      try {
        localStorage.setItem(`vision.identity.${state.options.projectId}`, nextId);
        localStorage.setItem(`vision.is_identified.${state.options.projectId}`, 'true');
      } catch {}
    }
  }

  state.cache = "";
  const anonId =
    !wasIdentified && previousVisitorId && previousVisitorId !== state.identity
      ? previousVisitorId
      : undefined;

  return send(
    {
      ...getPayload(),
      anonId,
      data: typeof id === "object" ? id : data,
    },
    "identify"
  );
};

export const reset = () => {
  state.identity = undefined;
  state.isIdentified = false;
  state.cache = undefined;
  state.visitorId = null;
  state.sessionId = undefined;
  if (typeof window !== 'undefined') {
    if ((window as any).vision) {
      (window as any).vision.visitorId = null;
    }
    if (state.options?.projectId) {
      try {
        localStorage.removeItem(`vision.identity.${state.options.projectId}`);
        localStorage.removeItem(`vision.is_identified.${state.options.projectId}`);
      } catch {}
    }
  }
};

export const init = (opts: VisionInitOptions) => {
  if (state.initialized || typeof window === 'undefined') return;
  state.initialized = true;
  state.options = opts;
  state.deviceId = opts.deviceId || null;

  if (typeof window !== 'undefined' && opts.projectId) {
    try {
      state.identity = localStorage.getItem(`vision.identity.${opts.projectId}`) || undefined;
      state.isIdentified = localStorage.getItem(`vision.is_identified.${opts.projectId}`) === 'true';
    } catch {}
  }

  if (typeof window !== 'undefined') {
    (window as any).vision = (window as any).vision || {};
    if ((window as any).vision.deviceId === undefined) {
      (window as any).vision.deviceId = state.deviceId;
    }
    if ((window as any).vision.visitorId === undefined) {
      (window as any).vision.visitorId = null;
    }
    (window as any).vision.reset = reset;
    (window as any).sigma = (window as any).vision;
  }

  const host = opts.hostUrl || "https://api.visionanalytics.com";
  state.endpoint = `${host.replace(/\/$/, "")}/api/send`;
  state.replayEndpoint = `${host.replace(/\/$/, "")}/api/replay`;

  state.currentUrl = normalize(window.location.href);
  state.currentRef = normalize(window.document.referrer.startsWith(window.location.origin) ? "" : window.document.referrer);

  const autoTrack = opts.autoTrack !== false;
  if (autoTrack && !trackingDisabled()) {
    track();
    initPageviewTracking(normalize, track);
    initClicksTracking(track, true);
    initAutocapture(track);
    if (opts.performance !== false) initPerformanceTracking(send, getPayload);
    if (opts.errors !== false) initErrorsTracking(send, getPayload);
    if (opts.sessionReplay) initReplay();
  }
};

export const getIds = () => ({
  sessionId: state.sessionId,
  visitorId: state.visitorId || state.identity || null,
  deviceId: (typeof window !== 'undefined' && (window as any).vision?.deviceId !== undefined)
    ? (window as any).vision.deviceId
    : (state.deviceId ?? null),
});
export const getSession = () => ({ cache: state.cache, project: state.options?.projectId, sessionId: state.sessionId });

export const abTest = (testId: string, variants: any[]) => initAbTests(testId, variants, state);
export const abConvert = (testId: string) => abConvertCall(testId, state);
