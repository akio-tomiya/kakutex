export function stripComment(line) {
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      escaped = !escaped;
      continue;
    }
    if (ch === '%' && !escaped) {
      return line.slice(0, i);
    }
    escaped = false;
  }
  return line;
}

export function linesWithOffsets(text) {
  const lines = text.split(/\n/);
  const offsets = [];
  let cursor = 0;
  for (const line of lines) {
    offsets.push(cursor);
    cursor += line.length + 1;
  }
  return { lines, offsets };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce(fn, ms = 300) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function countUnescapedInlineDollars(text) {
  let count = 0;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\') {
      escaped = !escaped;
      continue;
    }
    if (ch === '$' && !escaped) {
      const prev = text[i - 1];
      const next = text[i + 1];
      if (prev !== '$' && next !== '$') count += 1;
    }
    escaped = false;
  }
  return count;
}

export function readText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}


export async function saveBlob(blob, fileName, options = {}) {
  const suggestedName = String(fileName || 'download');
  const pickerTypes = Array.isArray(options.types) ? options.types : [];
  const canUsePicker = typeof window !== 'undefined'
    && typeof window.showSaveFilePicker === 'function'
    && window.isSecureContext;

  if (canUsePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: pickerTypes,
        excludeAcceptAllOption: false
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {
        method: 'picker',
        fileName: handle.name || suggestedName,
        cancelled: false
      };
    } catch (error) {
      if (error?.name === 'AbortError') {
        return { method: 'picker', fileName: suggestedName, cancelled: true };
      }
      throw error;
    }
  }

  downloadBlob(blob, suggestedName);
  return { method: 'download', fileName: suggestedName, cancelled: false };
}

export function normalizeNewlines(text) {
  return String(text ?? '').replace(/\r\n?/g, '\n');
}

export function serializeJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

export function todayIso() {
  return new Date().toISOString();
}
