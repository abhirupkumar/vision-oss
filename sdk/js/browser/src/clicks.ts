export const initClicksTracking = (
  track: (name: string, data: any) => void,
  autocaptureEnabled: boolean = true,
) => {
  const eventRegex = /data-vision-event-([\w-_]+)/;
  const eventNameAttribute = `data-vision-event`;

  const isElementIgnored = (el: any): boolean => {
    if (!el || typeof el.getAttribute !== 'function') return true;
    if (
      el.getAttribute('data-vision-ignore') !== null ||
      el.getAttribute('data-private') !== null
    ) {
      return true;
    }
    if (
      el.tagName === 'INPUT' &&
      el.getAttribute('type')?.toLowerCase() === 'password'
    ) {
      return true;
    }
    return false;
  };

  const getElementLabel = (el: HTMLElement): string => {
    if (!el) return '';
    const raw =
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      el.getAttribute('placeholder') ||
      el.innerText ||
      el.textContent ||
      el.getAttribute('name') ||
      el.id ||
      '';
    return raw.trim().replace(/\s+/g, ' ').slice(0, 100);
  };

  const trackElement = async (el: Element) => {
    const eventName = el.getAttribute(eventNameAttribute);
    if (eventName) {
      const eventData: Record<string, string | null> = {};

      el.getAttributeNames().forEach((name) => {
        const match = name.match(eventRegex);
        if (match) eventData[match[1]] = el.getAttribute(name);
      });

      return track(eventName, eventData);
    }
  };

  const onClick = async (e: MouseEvent) => {
    const el = e.target as HTMLElement | null;
    if (!el) return;

    // 1. Explicit data-vision-event has highest priority
    const taggedEl = el.closest ? (el.closest(`[${eventNameAttribute}]`) as HTMLElement | null) : null;
    if (taggedEl) {
      const href = taggedEl.getAttribute('href');
      const target = taggedEl.getAttribute('target');
      if (taggedEl.tagName === 'A' && href) {
        const external =
          target === '_blank' ||
          e.ctrlKey ||
          e.shiftKey ||
          e.metaKey ||
          (e.button && e.button === 1);
        if (!external) e.preventDefault();
        return trackElement(taggedEl).then(() => {
          if (!external) {
            (target === '_top' ? window.top!.location : window.location).href = href;
          }
        });
      }
      return trackElement(taggedEl);
    }

    // 2. Autocapture clicks on common interactive tags
    if (!autocaptureEnabled) return;

    const interactiveEl = el.closest
      ? (el.closest(
          "button, a, textarea, input, label, select, form, [role='button']",
        ) as HTMLElement | null)
      : null;
    const targetEl = interactiveEl || (el.tagName === 'P' ? el : null);

    if (!targetEl || isElementIgnored(targetEl)) return;

    const tag = targetEl.tagName.toLowerCase();
    const text = getElementLabel(targetEl);
    const id = targetEl.id || undefined;
    const className =
      typeof targetEl.className === 'string' && targetEl.className
        ? targetEl.className.slice(0, 100)
        : undefined;
    const name = targetEl.getAttribute('name') || undefined;
    const type = targetEl.getAttribute('type') || undefined;
    const href = targetEl.tagName === 'A' ? targetEl.getAttribute('href') : undefined;
    const action = targetEl.tagName === 'FORM' ? targetEl.getAttribute('action') : undefined;

    const eventData = {
      event_type: 'click',
      tag,
      ...(text && { text }),
      ...(id && { id }),
      ...(className && { class: className }),
      ...(name && { name }),
      ...(type && { type }),
      ...(href && { href }),
      ...(action && { action }),
    };

    if (targetEl.tagName === 'A' && href) {
      const target = targetEl.getAttribute('target');
      const external =
        target === '_blank' ||
        e.ctrlKey ||
        e.shiftKey ||
        e.metaKey ||
        (e.button && e.button === 1);
      if (!external) e.preventDefault();
      return track('$autocapture', eventData).then(() => {
        if (!external) {
          (target === '_top' ? window.top!.location : window.location).href = href;
        }
      });
    }

    return track('$autocapture', eventData);
  };

  document.addEventListener('click', onClick, true);
};
