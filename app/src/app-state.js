import { DEFAULT_BODY, DEFAULT_FILE_NAME, DEFAULT_MACROS } from './config.js';
import { todayIso } from './utils.js';

export function detectInitialLocale(navigatorLike = typeof navigator !== 'undefined' ? navigator : undefined) {
  const candidates = [];
  if (navigatorLike) {
    if (Array.isArray(navigatorLike.languages)) candidates.push(...navigatorLike.languages);
    if (typeof navigatorLike.language === 'string') candidates.push(navigatorLike.language);
  }
  return candidates.some((value) => /^ja(?:-|$)/i.test(String(value))) ? 'ja' : 'en';
}

export function createInitialState({ protocol = 'http:', locale } = {}) {
  const now = todayIso();
  const resolvedLocale = locale ?? detectInitialLocale();
  return {
    locale: resolvedLocale,
    body: DEFAULT_BODY,
    macros: DEFAULT_MACROS,
    fileName: DEFAULT_FILE_NAME,
    createdAt: now,
    updatedAt: now,
    blocks: [],
    diagnostics: [],
    selectedBlockId: null,
    lastSyncedBlockId: null,
    lastSavedSignature: '',
    autosaveLoaded: false,
    mathJaxReady: false,
    runtimeStatusKey: protocol === 'file:' ? 'statusFileProtocol' : 'statusMathPending',
    inputAssist: false,
    lastFocusedEditor: 'body'
  };
}

export function snapshotSignature(state) {
  return JSON.stringify({
    locale: state.locale,
    body: state.body,
    macros: state.macros,
    fileName: state.fileName
  });
}

export function decorateBlocks(blocks, prefix = 'block') {
  return blocks.map((block, index) => ({ ...block, blockId: `${prefix}-${index + 1}` }));
}

export function flattenBlocks(blocks) {
  return Array.isArray(blocks) ? [...blocks] : [];
}

export function collectAllDiagnostics(parsedDoc, parsedMacros) {
  return [...parsedMacros.diagnostics, ...parsedDoc.diagnostics]
    .sort((a, b) => a.lineStart - b.lineStart || a.lineEnd - b.lineEnd);
}

export function buildAutosavePayload(state, appVersion) {
  return {
    version: appVersion,
    body: state.body,
    macros: state.macros,
    locale: state.locale,
    fileName: state.fileName,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    inputAssist: Boolean(state.inputAssist)
  };
}
