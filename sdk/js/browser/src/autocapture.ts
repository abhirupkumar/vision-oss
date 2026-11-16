export const initAutocapture = (track: (name: string, data: any) => void) => {
  if (typeof document === 'undefined') return;

  const isElementIgnored = (el: any): boolean => {
    if (!el) return true;
    if (typeof el.getAttribute !== 'function') return false;
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

  // Form submissions
  const onSubmit = (e: SubmitEvent) => {
    const form = e.target as HTMLFormElement | null;
    if (!form || form.tagName !== 'FORM' || isElementIgnored(form)) return;
    track('$autocapture', {
      event_type: 'submit',
      tag: 'form',
      form_id: form.id || undefined,
      form_name: form.getAttribute('name') || undefined,
      action: form.getAttribute('action') || undefined,
      method: (form.getAttribute('method') || 'get').toUpperCase(),
      element_count: form.elements ? form.elements.length : undefined,
    });
  };

  // Input value changes (select, checkbox, radio, input, textarea)
  const onChange = (e: Event) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!el || isElementIgnored(el)) return;
    const tag = el.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'select' && tag !== 'textarea') return;

    const data: Record<string, any> = {
      event_type: 'change',
      tag,
      input_name: el.getAttribute('name') || undefined,
      input_id: el.id || undefined,
      input_type: el.getAttribute('type') || undefined,
    };

    if (tag === 'select') {
      const select = el as HTMLSelectElement;
      const selectedOption =
        select.options && select.selectedIndex >= 0
          ? select.options[select.selectedIndex]
          : null;
      if (selectedOption) {
        data.selected_text = (selectedOption.text || '').trim().slice(0, 50);
      }
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      data.checked = (el as HTMLInputElement).checked;
    } else {
      data.has_value = Boolean(el.value);
      data.value_length = el.value ? el.value.length : 0;
    }

    track('$autocapture', data);
  };

  // Content edits (contenteditable="true")
  const onContentEdit = (e: FocusEvent) => {
    const el = e.target as HTMLElement | null;
    if (!el || isElementIgnored(el)) return;
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      const text = (el.innerText || el.textContent || '').trim();
      track('$autocapture', {
        event_type: 'content_edit',
        tag: el.tagName?.toLowerCase(),
        id: el.id || undefined,
        class:
          typeof el.className === 'string' && el.className
            ? el.className.slice(0, 100)
            : undefined,
        content_length: text.length,
        snippet: text.slice(0, 50),
      });
    }
  };

  // Clipboard copies
  const onCopy = (e: ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (isElementIgnored(target)) return;

    let selectedText = '';
    try {
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        const input = target as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        if (
          typeof start === 'number' &&
          typeof end === 'number' &&
          end > start
        ) {
          selectedText = input.value.substring(start, end);
        }
      }
      if (!selectedText) {
        const sel =
          (typeof window !== 'undefined' &&
            window.getSelection &&
            window.getSelection()) ||
          (typeof document !== 'undefined' &&
            document.getSelection &&
            document.getSelection());
        selectedText = (sel ? sel.toString() : '').trim();
      }
    } catch {}

    if (!selectedText) return;

    track('$autocapture', {
      event_type: 'copy',
      target_tag: target?.tagName ? target.tagName.toLowerCase() : undefined,
      target_id: target?.id || undefined,
      selection_length: selectedText.length,
      selected_text: selectedText.slice(0, 100),
    });
  };

  document.addEventListener('submit', onSubmit as any, true);
  document.addEventListener('change', onChange, true);
  document.addEventListener('blur', onContentEdit, true);
  document.addEventListener('copy', onCopy as any, true);
};
