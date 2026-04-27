import { APP_VERSION, DEFAULT_BODY, DEFAULT_FILE_NAME, DEFAULT_MACROS, INPUT_ASSIST_SNIPPETS } from './config.js';
import {
  buildAutosavePayload,
  collectAllDiagnostics,
  createInitialState,
  decorateBlocks,
  flattenBlocks,
  snapshotSignature
} from './app-state.js';
import { getStrings, t } from './i18n.js';
import { waitForMathJax, updateMathJaxMacros, typesetPreview } from './mathjax-bridge.js';
import { parseMacros } from './macros.js';
import { parseDocument } from './parser.js';
import { renderPreview } from './renderer.js';
import { loadAutosave, saveAutosave } from './storage.js';
import { exportTexFile } from './tex-export.js';
import { buildTexsArchive, parseTexsArchive } from './texs-archive.js';
import {
  applyRuntimeStatus,
  getElements,
  localizeStaticUi,
  openAboutDialog,
  renderDiagnostics,
  updateAssistUi,
  updateDirtyIndicator,
  updateFilenameChip
} from './ui-shell.js';
import { clamp, debounce, normalizeNewlines, saveBlob, todayIso } from './utils.js';

const elements = getElements(document);

const state = createInitialState({ protocol: location.protocol });

function currentStrings() {
  return getStrings(state.locale);
}

function refreshFilenameChip() {
  updateFilenameChip(elements, state.locale, state.fileName, document);
}

function refreshDirtyIndicator() {
  updateDirtyIndicator(elements, state.locale, isDirty());
}

function markSaved() {
  state.lastSavedSignature = snapshotSignature(state);
  refreshDirtyIndicator();
}

function isDirty() {
  return snapshotSignature(state) !== state.lastSavedSignature;
}

function setRuntimeStatus(statusKey = state.runtimeStatusKey) {
  state.runtimeStatusKey = statusKey;
  applyRuntimeStatus(elements, state.locale, statusKey);
}


function focusEditor(editorName = state.lastFocusedEditor || 'body') {
  const editor = editorName === 'macro' ? elements.macroEditor : elements.bodyEditor;
  editor?.focus();
  state.lastFocusedEditor = editorName === 'macro' ? 'macro' : 'body';
  return editor;
}

function activeEditor() {
  return state.lastFocusedEditor === 'macro' ? elements.macroEditor : elements.bodyEditor;
}

function applyAssistUi() {
  updateAssistUi(elements, state.locale, Boolean(state.inputAssist));
}

function insertSnippet(kind) {
  const snippet = INPUT_ASSIST_SNIPPETS?.[kind];
  if (!snippet) return;
  const editor = focusEditor('body');
  const marker = '{{cursor}}';
  const template = String(snippet.text ?? '');
  const markerIndex = template.indexOf(marker);
  const insertion = template.replace(marker, '');
  const start = editor.selectionStart ?? editor.value.length;
  const end = editor.selectionEnd ?? start;
  editor.setRangeText(insertion, start, end, 'end');
  const caret = start + (markerIndex >= 0 ? markerIndex : insertion.length);
  editor.setSelectionRange(caret, caret);
  state.lastFocusedEditor = 'body';
  elements.status.textContent = t(state.locale, 'snippetInserted');
  debouncedRender();
}

async function rerender() {
  state.body = normalizeNewlines(elements.bodyEditor.value);
  state.macros = normalizeNewlines(elements.macroEditor.value);
  const parsedMacros = parseMacros(state.macros, state.locale);
  updateMathJaxMacros(parsedMacros.macros);
  const parsedDoc = parseDocument(state.body, { userMacros: parsedMacros.macros });
  state.blocks = decorateBlocks(parsedDoc.blocks);
  const staticDiagnostics = collectAllDiagnostics(parsedDoc, parsedMacros);
  let runtimeDiagnostics = [];
  renderPreview(elements.preview, state.blocks, currentStrings(), parsedMacros.macros);
  if (state.mathJaxReady) {
    try {
      runtimeDiagnostics = await typesetPreview(elements.preview);
    } catch (error) {
      console.warn('MathJax typeset failed', error);
      state.mathJaxReady = false;
      setRuntimeStatus(location.protocol === 'file:' ? 'statusFileProtocol' : 'statusMathUnavailable');
    }
  }
  state.diagnostics = [...staticDiagnostics, ...runtimeDiagnostics]
    .sort((a, b) => a.lineStart - b.lineStart || a.lineEnd - b.lineEnd);
  renderDiagnostics(elements, state.locale, state.diagnostics);
  state.updatedAt = todayIso();
  refreshFilenameChip();
  refreshDirtyIndicator();
  persistAutosave();
  applySelectedBlock();
}

const debouncedRender = debounce(() => {
  rerender().catch((error) => {
    console.error(error);
    elements.status.textContent = error.message;
  });
}, 350);

function persistAutosave() {
  saveAutosave(buildAutosavePayload(state, APP_VERSION));
}

function loadFromModel(model, { markClean = false } = {}) {
  state.locale = model.locale ?? state.locale;
  state.body = normalizeNewlines(model.body ?? DEFAULT_BODY);
  state.macros = normalizeNewlines(model.macros ?? DEFAULT_MACROS);
  state.fileName = model.fileName ?? DEFAULT_FILE_NAME;
  state.createdAt = model.createdAt ?? todayIso();
  state.updatedAt = model.updatedAt ?? todayIso();
  state.inputAssist = Boolean(model.inputAssist ?? model.ui?.inputAssist ?? state.inputAssist);
  elements.bodyEditor.value = state.body;
  elements.macroEditor.value = state.macros;
  localizeStaticUi(elements, state.locale, location.protocol, document);
  applyAssistUi();
  refreshFilenameChip();
  if (markClean) markSaved();
  rerender().then(() => {
    if (markClean) markSaved();
  });
}

function tryRecoverAutosave() {
  const saved = loadAutosave();
  if (!saved?.body && !saved?.macros) return;
  state.autosaveLoaded = true;
  loadFromModel(saved, { markClean: false });
  elements.status.textContent = t(saved.locale ?? state.locale, 'recoveredAutosave');
}

function getClosestBlockForCursor() {
  const flat = flattenBlocks(state.blocks);
  const cursor = elements.bodyEditor.selectionStart;
  if (!flat.length) return null;
  let chosen = flat[0];
  for (const block of flat) {
    if (cursor >= block.offsetStart && cursor <= block.offsetEnd + 1) {
      chosen = block;
      break;
    }
    if (cursor > block.offsetEnd) chosen = block;
  }
  return chosen;
}

function setActiveBlock(blockId) {
  state.selectedBlockId = blockId;
  applySelectedBlock();
}

function applySelectedBlock() {
  const nodes = elements.preview.querySelectorAll('.preview-block');
  nodes.forEach((node) => node.classList.toggle('active', node.dataset.blockId === state.selectedBlockId));
}

function scrollPreviewToCurrentBlock() {
  const block = getClosestBlockForCursor();
  if (!block) return;
  setActiveBlock(block.blockId);
  const target = elements.preview.querySelector(`[data-block-id="${block.blockId}"]`);
  target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  state.lastSyncedBlockId = block.blockId;
}

function editorLineHeightPx() {
  const lineHeight = Number.parseFloat(window.getComputedStyle(elements.bodyEditor).lineHeight);
  return Number.isFinite(lineHeight) ? lineHeight : 22;
}

function scrollSourceToSelectedBlock() {
  const flat = flattenBlocks(state.blocks);
  const target = flat.find((block) => block.blockId === state.selectedBlockId)
    ?? flat.find((block) => block.blockId === state.lastSyncedBlockId);
  if (!target) return;
  elements.bodyEditor.focus();
  elements.bodyEditor.setSelectionRange(target.offsetStart, target.offsetEnd);
  elements.bodyEditor.scrollTop = clamp((target.lineStart - 2) * editorLineHeightPx(), 0, elements.bodyEditor.scrollHeight);
}

function confirmDiscardChanges() {
  if (!isDirty()) return true;
  return window.confirm(t(state.locale, 'confirmLoseChanges'));
}

async function onSaveTexs() {
  try {
    const blob = buildTexsArchive({
      body: state.body,
      macros: state.macros,
      ui: { locale: state.locale, inputAssist: state.inputAssist },
      meta: {
        fileName: state.fileName,
        createdAt: state.createdAt,
        updatedAt: todayIso(),
        version: APP_VERSION,
        appName: 'KakuTeX'
      }
    });
    const result = await saveBlob(blob, state.fileName, {
      types: [
        {
          description: 'KakuTeX archive',
          accept: {
            'application/zip': ['.texs'],
            'application/octet-stream': ['.texs']
          }
        }
      ]
    });
    if (result?.cancelled) return;
    if (result?.fileName) {
      state.fileName = result.fileName;
      refreshFilenameChip();
    }
    markSaved();
    elements.status.textContent = t(state.locale, 'savedTexs');
  } catch (error) {
    console.error(error);
    elements.status.textContent = t(state.locale, 'saveFailed');
  }
}

async function onExportTex() {
  try {
    const result = await exportTexFile({ body: state.body, macros: state.macros }, state.fileName.replace(/\.texs?$/i, '.tex'));
    if (result?.cancelled) return;
    elements.status.textContent = t(state.locale, 'savedTex');
  } catch (error) {
    console.error(error);
    elements.status.textContent = t(state.locale, 'saveFailed');
  }
}

function onPrintPdf() {
  try {
    window.print();
    elements.status.textContent = t(state.locale, 'printedPdf');
  } catch (error) {
    console.error(error);
    elements.status.textContent = t(state.locale, 'printFailed');
  }
}

async function onOpenTexs(event) {
  const [file] = event.target.files ?? [];
  if (!file) return;
  try {
    const parsed = await parseTexsArchive(file);
    const resolvedName = file.name.endsWith('.texs') ? file.name : `${file.name}.texs`;
    loadFromModel({
      body: parsed.body,
      macros: parsed.macros,
      locale: parsed.ui?.locale ?? state.locale,
      fileName: parsed.meta?.fileName ?? resolvedName,
      createdAt: parsed.meta?.createdAt,
      updatedAt: parsed.meta?.updatedAt,
      inputAssist: parsed.ui?.inputAssist
    }, { markClean: true });
    state.fileName = parsed.meta?.fileName ?? resolvedName;
    refreshFilenameChip();
    markSaved();
    elements.status.textContent = t(state.locale, 'openedTexs');
  } catch (error) {
    console.error(error);
    elements.status.textContent = t(state.locale, 'openFailed');
    renderDiagnostics(elements, state.locale, [...state.diagnostics, { severity: 'error', lineStart: 1, lineEnd: 1, key: 'diagArchive', detail: error.message }]);
  } finally {
    event.target.value = '';
  }
}

function onNewNote() {
  if (!confirmDiscardChanges()) return;
  state.fileName = DEFAULT_FILE_NAME;
  loadFromModel({
    body: DEFAULT_BODY,
    macros: DEFAULT_MACROS,
    locale: state.locale,
    fileName: DEFAULT_FILE_NAME,
    createdAt: todayIso(),
    updatedAt: todayIso(),
    inputAssist: state.inputAssist
  }, { markClean: false });
  elements.status.textContent = t(state.locale, 'newCreated');
}



function onUndo() {
  const editor = activeEditor();
  editor?.focus();
  if (typeof document.execCommand === 'function') {
    document.execCommand('undo');
  }
  elements.status.textContent = t(state.locale, 'undoDone');
  debouncedRender();
}

function onToggleAssist() {
  state.inputAssist = !state.inputAssist;
  applyAssistUi();
  persistAutosave();
  elements.status.textContent = t(state.locale, state.inputAssist ? 'assistEnabled' : 'assistDisabled');
}

function onToggleLocale() {
  state.locale = state.locale === 'ja' ? 'en' : 'ja';
  localizeStaticUi(elements, state.locale, location.protocol, document);
  applyAssistUi();
  refreshFilenameChip();
  renderDiagnostics(elements, state.locale, state.diagnostics);
  const parsedMacros = parseMacros(state.macros, state.locale);
  renderPreview(elements.preview, state.blocks, currentStrings(), parsedMacros.macros);
  if (state.mathJaxReady) {
    typesetPreview(elements.preview).catch((error) => console.warn(error));
  }
  persistAutosave();
  refreshDirtyIndicator();
  setRuntimeStatus(state.runtimeStatusKey);
}

function updateSelectionState() {
  const block = getClosestBlockForCursor();
  if (!block) return;
  setActiveBlock(block.blockId);
}

function bindUi() {
  elements.bodyEditor.addEventListener('focus', () => { state.lastFocusedEditor = 'body'; });
  elements.macroEditor.addEventListener('focus', () => { state.lastFocusedEditor = 'macro'; });
  elements.bodyEditor.addEventListener('input', debouncedRender);
  elements.bodyEditor.addEventListener('click', updateSelectionState);
  elements.bodyEditor.addEventListener('keyup', updateSelectionState);
  elements.bodyEditor.addEventListener('select', updateSelectionState);
  elements.macroEditor.addEventListener('input', debouncedRender);
  elements.preview.addEventListener('click', (event) => {
    const target = event.target.closest('.preview-block');
    if (!target) return;
    state.selectedBlockId = target.dataset.blockId;
    applySelectedBlock();
    scrollSourceToSelectedBlock();
  });
  elements.newBtn.addEventListener('click', onNewNote);
  elements.openBtn.addEventListener('click', () => {
    if (!confirmDiscardChanges()) return;
    elements.fileInput.click();
  });
  elements.saveBtn.addEventListener('click', onSaveTexs);
  elements.exportTexBtn.addEventListener('click', onExportTex);
  elements.exportPdfBtn.addEventListener('click', onPrintPdf);
  elements.aboutBtn.addEventListener('click', () => openAboutDialog(elements, state.locale));
  elements.undoBtn.addEventListener('click', onUndo);
  elements.assistToggleBtn.addEventListener('click', onToggleAssist);
  elements.assistButtons.forEach((button) => button.addEventListener('click', () => insertSnippet(button.dataset.assistKind)));
  elements.version.addEventListener('click', () => openAboutDialog(elements, state.locale));
  elements.localeBtn.addEventListener('click', onToggleLocale);
  elements.fileInput.addEventListener('change', onOpenTexs);
  elements.syncPreviewBtn.addEventListener('click', scrollPreviewToCurrentBlock);
  elements.syncSourceBtn.addEventListener('click', scrollSourceToSelectedBlock);
  window.addEventListener('beforeunload', (event) => {
    if (!isDirty()) return undefined;
    event.preventDefault();
    event.returnValue = t(state.locale, 'browserWarning');
    return t(state.locale, 'browserWarning');
  });
}

async function initializeMathRuntime() {
  try {
    const ready = await waitForMathJax({ timeoutMs: location.protocol === 'file:' ? 1200 : 5000 });
    state.mathJaxReady = Boolean(ready && window.MathJax?.typesetPromise);
  } catch (error) {
    console.warn('MathJax startup was not available in time', error);
    state.mathJaxReady = false;
  }
  return state.mathJaxReady;
}

async function init() {
  bindUi();
  localizeStaticUi(elements, state.locale, location.protocol, document);
  applyAssistUi();
  elements.bodyEditor.value = state.body;
  elements.macroEditor.value = state.macros;
  refreshFilenameChip();
  markSaved();
  setRuntimeStatus(state.runtimeStatusKey);
  tryRecoverAutosave();
  await rerender();
  const mathReady = await initializeMathRuntime();
  if (mathReady) {
    setRuntimeStatus('statusReady');
    await rerender();
  } else {
    setRuntimeStatus(location.protocol === 'file:' ? 'statusFileProtocol' : 'statusMathUnavailable');
  }
  if (!state.autosaveLoaded) markSaved();
  window.__texsApp = {
    getState: () => JSON.parse(JSON.stringify(state)),
    loadModel: (model) => loadFromModel(model, { markClean: true }),
    rerender,
    parseDocument,
    parseMacros
  };
}

init().catch((error) => {
  console.error(error);
  elements.status.textContent = error.message;
});
