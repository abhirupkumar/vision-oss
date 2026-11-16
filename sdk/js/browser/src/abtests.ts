export const initAbTests = async (testId: string, variants: any[], state: any) => {
  if (state.disabled || !state.options?.projectId) return null;
  const storageKey = `vision_ab_${testId}`;
  let assigned;
  try {
    const stored = window.localStorage?.getItem(storageKey);
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
      window.localStorage?.setItem(storageKey, JSON.stringify(assigned));
    } catch (_) {}

    if (state.sessionId && assigned?.id) {
      const host = state.options?.hostUrl || "https://api.visionanalytics.com";
      fetch(`${host}/api/projects/${state.options.projectId}/ab-tests/${testId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assign",
          variantId: assigned.id,
          sessionId: state.sessionId,
        }),
      }).catch(() => {});
    }
  }
  return assigned;
};

export const abConvertCall = (testId: string, state: any) => {
  if (state.disabled || !state.sessionId) return;
  const host = state.options?.hostUrl || "https://api.visionanalytics.com";
  fetch(`${host}/api/projects/${state.options?.projectId}/ab-tests/${testId}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "convert", sessionId: state.sessionId }),
  }).catch(() => {});
};
