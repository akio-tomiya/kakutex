import { APP_STORAGE_KEY } from './config.js';

export function saveAutosave(payload) {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload));
}

export function loadAutosave() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
