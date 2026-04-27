(function () {
  'use strict';
  const __cache = Object.create(null);
  const __factories = Object.create(null);
  function __load(id) {
    if (Object.prototype.hasOwnProperty.call(__cache, id)) return __cache[id];
    const factory = __factories[id];
    if (!factory) throw new Error(`Unknown module: ${id}`);
    const exports = factory(__load);
    __cache[id] = exports;
    return exports;
  }
  __factories['./app-state.js'] = function (__load) {
const { DEFAULT_BODY, DEFAULT_FILE_NAME, DEFAULT_MACROS } = __load('./config.js');
const { todayIso } = __load('./utils.js');
function detectInitialLocale(navigatorLike = typeof navigator !== 'undefined' ? navigator : undefined) {
  const candidates = [];
  if (navigatorLike) {
    if (Array.isArray(navigatorLike.languages)) candidates.push(...navigatorLike.languages);
    if (typeof navigatorLike.language === 'string') candidates.push(navigatorLike.language);
  }
  return candidates.some((value) => /^ja(?:-|$)/i.test(String(value))) ? 'ja' : 'en';
}
function createInitialState({ protocol = 'http:', locale } = {}) {
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
function snapshotSignature(state) {
  return JSON.stringify({
    locale: state.locale,
    body: state.body,
    macros: state.macros,
    fileName: state.fileName
  });
}
function decorateBlocks(blocks, prefix = 'block') {
  return blocks.map((block, index) => ({ ...block, blockId: `${prefix}-${index + 1}` }));
}
function flattenBlocks(blocks) {
  return Array.isArray(blocks) ? [...blocks] : [];
}
function collectAllDiagnostics(parsedDoc, parsedMacros) {
  return [...parsedMacros.diagnostics, ...parsedDoc.diagnostics]
    .sort((a, b) => a.lineStart - b.lineStart || a.lineEnd - b.lineEnd);
}
function buildAutosavePayload(state, appVersion) {
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
    return { detectInitialLocale: detectInitialLocale, createInitialState: createInitialState, snapshotSignature: snapshotSignature, decorateBlocks: decorateBlocks, flattenBlocks: flattenBlocks, collectAllDiagnostics: collectAllDiagnostics, buildAutosavePayload: buildAutosavePayload };
  };
  __factories['./config.js'] = function (__load) {
const APP_VERSION = '0.0.1';
const APP_STARTED_AT = '2026-04-19';
const APP_AUTHOR_NAME = 'Akio Tomiya (with ChatGPT5.4)';
const APP_AUTHOR_URL = 'https://www2.yukawa.kyoto-u.ac.jp/~akio.tomiya/';
const APP_STORAGE_KEY = 'kakutex.autosave.v1';
const DEFAULT_FILE_NAME = 'note.texs';
const EXPORT_TEX_NAME = 'note.tex';
const SUPPORTED_MATH_ENVS = new Set([
  'equation', 'equation*',
  'align', 'align*',
  'gather', 'gather*',
  'aligned', 'gathered', 'split', 'alignat', 'alignat*',
  'eqnarray', 'eqnarray*'
]);
const LIST_ENVS = new Set(['itemize', 'enumerate']);
const HEADING_COMMANDS = ['section', 'subsection', 'subsubsection', 'paragraph'];
const BUILTIN_MACROS = Object.freeze({
  slashed: [String.raw`{\not\!#1}`, 1]
});
const DEFAULT_BODY = String.raw`\section{Introduction}
KakuTeX is a web app for a subset of \LaTeX with fast rendering.\\
Hard line breaks work, and inline math such as $E=mc^2$ is supported.
日本語も使えます。

\subsection{Linear algebra}
\begin{align}
\Tr M &= 0 \\
\Det A &= 1 \\
\slashed{D} &= \gamma^\mu A_\mu \\
\int \mathrm{d}x \; \sin x &= -\cos x + C
\end{align}

\begin{itemize}
\item First bullet item
\item Second bullet item
\end{itemize}

\subsubsection{Subsubsection}
\paragraph{Paragraph} This is a short paragraph heading example.`;
const DEFAULT_MACROS = String.raw`% no-argument macros only
\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}`;
const INPUT_ASSIST_SNIPPETS = Object.freeze({
  math: {
    key: 'assistMath',
    text: String.raw`\begin{align}
  {{cursor}}
\end{align}`
  },
  frac: {
    key: 'assistFrac',
    text: String.raw`\frac{1}{2}{{cursor}}`
  },
  sum: {
    key: 'assistSum',
    text: String.raw`\sum_{i=1}^{N} {{cursor}}`
  },
  integral: {
    key: 'assistIntegral',
    text: String.raw`\int_{}^{} \mathrm{d}x {{cursor}}`
  }
});
const TEXT_COMMAND_REPLACEMENTS = Object.freeze({
  LaTeX: 'LaTeX',
  TeX: 'TeX'
});
    return { APP_VERSION: APP_VERSION, APP_STARTED_AT: APP_STARTED_AT, APP_AUTHOR_NAME: APP_AUTHOR_NAME, APP_AUTHOR_URL: APP_AUTHOR_URL, APP_STORAGE_KEY: APP_STORAGE_KEY, DEFAULT_FILE_NAME: DEFAULT_FILE_NAME, EXPORT_TEX_NAME: EXPORT_TEX_NAME, SUPPORTED_MATH_ENVS: SUPPORTED_MATH_ENVS, LIST_ENVS: LIST_ENVS, HEADING_COMMANDS: HEADING_COMMANDS, BUILTIN_MACROS: BUILTIN_MACROS, DEFAULT_BODY: DEFAULT_BODY, DEFAULT_MACROS: DEFAULT_MACROS, INPUT_ASSIST_SNIPPETS: INPUT_ASSIST_SNIPPETS, TEXT_COMMAND_REPLACEMENTS: TEXT_COMMAND_REPLACEMENTS };
  };
  __factories['./help-links.js'] = function (__load) {
const MANUALS = {
  ja: {
    html: '../docs/user_manual/kakutex-user-manual-ja.html',
    pdf: '../docs/user_manual/kakutex-user-manual.pdf'
  },
  en: {
    html: '../docs/user_manual/kakutex-user-manual-en.html',
    pdf: '../docs/user_manual/kakutex-user-manual-en.pdf'
  }
};

function resolveLocale(locale) {
  return /^en(?:-|$)/i.test(String(locale ?? '')) ? 'en' : 'ja';
}
function getManualTargets(locale, anchor = '') {
  const resolvedLocale = resolveLocale(locale);
  const base = MANUALS[resolvedLocale];
  const hash = anchor ? `#${anchor}` : '';
  return {
    locale: resolvedLocale,
    htmlUrl: `${base.html}${hash}`,
    pdfUrl: base.pdf,
    htmlPath: base.html,
    pdfPath: base.pdf
  };
}
    return { getManualTargets: getManualTargets };
  };
  __factories['./i18n.js'] = function (__load) {
const STRINGS = {
  ja: {
    newNote: '新規',
    openTexs: '開く .texs',
    saveTexs: '保存 .texs',
    exportTex: '書き出し .tex',
    exportPdf: '印刷 / PDF',
    aboutBtn: '情報',
    helpBtn: 'ヘルプ',
    undoBtn: 'もとに戻す',
    assistEnable: '入力補助',
    assistDisable: 'シンプル',
    assistMath: '数式',
    assistFrac: '分数',
    assistSum: '和',
    assistIntegral: '積分',
    localeToggle: 'EN',
    sourceTitle: 'ソース',
    sourceSubtitle: '',
    previewTitle: 'プレビュー',
    previewSubtitle: '',
    macroTitle: '新規コマンド',
    macroSubtitle: '引数なしの \\newcommand のみを扱います。',
    diagnosticsTitle: 'エラーと警告',
    diagnosticsSubtitle: '',
    filenameLabel: '現在のファイル',
    dirty: '未保存',
    syncToPreview: '→',
    syncToSource: '←',
    syncToPreviewTitle: 'ソース位置に近いブロックへ移動',
    syncToSourceTitle: '選択ブロックのソースへ戻る',
    emptyPreview: '対応構文がまだありません。ソースを入力するとここに表示されます。',
    autosaveReady: '',
    autosaveMissing: '',
    savedTexs: '.texs を保存しました。',
    savedTex: '.tex を書き出しました。',
    openedTexs: '.texs を読み込みました。',
    helpOpened: 'ヘルプを新しいタブで開きました。',
    printedPdf: '印刷ダイアログを開きました。PDF に保存を選んでください。',
    newCreated: '新規ノートを作成しました。',
    recoveredAutosave: '自動退避から内容を復元しました。',
    undoDone: 'ひとつ前の編集に戻しました。',
    assistEnabled: '入力補助を表示しました。',
    assistDisabled: '入力補助を隠しました。',
    snippetInserted: '入力補助からスニペットを挿入しました。',
    statusReady: '準備完了。編集すると自動でプレビューします。',
    statusMathPending: '数式エンジンを初期化しています。少し待つと数式プレビューが有効になります。',
    statusMathUnavailable: '数式エンジンの初期化に失敗したか、まだ完了していません。編集は継続できます。',
    statusFileProtocol: 'file:// 直開きです。安定利用はユーザーマニュアルの「2.1 ローカル起動」を参照してください。',
    noDiagnostics: '現在のところ、致命的な問題は見つかっていません。',
    unsupported: '未対応',
    lineRange: '行',
    confirmLoseChanges: '未保存の変更があります。続けると現在の内容は失われます。',
    openFailed: 'ファイルの読み込みに失敗しました。',
    saveFailed: '保存に失敗しました。',
    printFailed: '印刷用ウィンドウを開けませんでした。',
    browserWarning: '未保存の変更があります。',
    localeName: '日本語',
    severityError: 'エラー',
    severityWarning: '警告',
    severityInfo: '情報',
    diagUnclosedEnv: '環境が閉じていません。',
    diagUnsupportedEnv: 'この環境は初版では未対応です。',
    diagOddDollar: 'インライン数式の $ が閉じていない可能性があります。',
    diagMacroSyntax: 'マクロ定義の書式を解釈できませんでした。',
    diagMacroArgs: '初版では引数付き \\newcommand は未対応です。',
    diagMacroDuplicate: '同名マクロが後ろの定義で上書きされます。',
    diagMacroReserved: '組み込みマクロ名は上書きできません。',
    diagArchive: '.texs アーカイブを解析できませんでした。',
    diagUnsupportedZip: 'この .texs は初版アプリの保存形式と異なる可能性があります。',
    diagEqnarray: 'eqnarray は互換レイヤとして align 扱いでプレビューします。',
    diagUnknownBlock: '未知のブロックはそのまま表示します。',
    diagFileProtocol: 'file:// 直開きでは数式プレビューが不安定になることがあります。ローカル起動手順はユーザーマニュアルの「2.1 ローカル起動」を見てください。',
    diagMathJaxUnavailable: '数式エンジンが未初期化または初期化待ちです。プレビューは生テキストのまま残ることがあります。',
    diagMathNestedEnv: '数式環境の中では、この \\begin / \\end は使えません。',
    diagMathItem: '数式環境の中では \\item は使えません。',
    diagItemOutsideList: '\\item は itemize / enumerate の外では使えません。',
    diagIllegalHash: '# はマクロ定義の外では使えません。',
    diagFracSyntax: '\\frac の直後は {分子}{分母} の形にしてください。',
    diagUnknownMathCommand: '未定義または未対応の数式コマンドの可能性があります。',
    diagUnknownTextCommand: 'この位置では未対応または不自然なコマンドです。',
    adminAppEntry: '公開用エントリ',
    adminOfflineReady: '同梱ライブラリあり',
    fileProtocolTitle: 'file:// 直開きでは一部機能が不安定です。',
    fileProtocolBody: '静的サーバ経由で開くと安定します。ユーザーマニュアルの「2.1 ローカル起動」と「10. 既知の制限」を参照してください。',
    fileProtocolCommandLabel: '推奨起動',
    fileProtocolCommand: 'python3 -m http.server 8000',
    fileProtocolUrl: 'http://127.0.0.1:8000/app/',
    fileProtocolDocLabel: 'ローカル起動のヘルプ',
    aboutDialogTitle: 'KakuTeX について',
    aboutTagline: 'TeX サブセット・メモアプリ',
    aboutVersionLabel: 'バージョン',
    aboutStartedLabel: '開発開始',
    aboutAuthorLabel: '作者',
    aboutLinkLabel: 'Web',
    aboutDisclaimerLabel: '免責事項',
    aboutDisclaimerText: '利用上の注意と免責事項を開く',
    aboutClose: '閉じる'
  },
  en: {
    newNote: 'New',
    openTexs: 'Open .texs',
    saveTexs: 'Save .texs',
    exportTex: 'Export .tex',
    exportPdf: 'Print / PDF',
    aboutBtn: 'Info',
    helpBtn: 'Help',
    undoBtn: 'Undo',
    assistEnable: 'Assist',
    assistDisable: 'Simple',
    assistMath: 'Math',
    assistFrac: 'Fraction',
    assistSum: 'Sum',
    assistIntegral: 'Integral',
    localeToggle: '日本語',
    sourceTitle: 'Source',
    sourceSubtitle: '',
    previewTitle: 'Preview',
    previewSubtitle: '',
    macroTitle: 'New commands',
    macroSubtitle: 'Only no-argument \\newcommand is supported.',
    diagnosticsTitle: 'Errors and warnings',
    diagnosticsSubtitle: '',
    filenameLabel: 'Current file',
    dirty: 'Unsaved',
    syncToPreview: '→',
    syncToSource: '←',
    syncToPreviewTitle: 'Jump to the closest preview block for the source cursor',
    syncToSourceTitle: 'Jump back to the source for the selected preview block',
    emptyPreview: 'No supported blocks yet. The preview will appear here.',
    autosaveReady: '',
    autosaveMissing: '',
    savedTexs: '.texs file saved.',
    savedTex: '.tex exported.',
    openedTexs: '.texs file loaded.',
    helpOpened: 'Opened help in a new tab.',
    printedPdf: 'Print dialog opened. Choose Save as PDF in the browser.',
    newCreated: 'New note created.',
    recoveredAutosave: 'Recovered content from autosave.',
    undoDone: 'Undid the previous edit.',
    assistEnabled: 'Input assist is now visible.',
    assistDisabled: 'Input assist is now hidden.',
    snippetInserted: 'Inserted a snippet from input assist.',
    statusReady: 'Ready. The preview updates automatically as you type.',
    statusMathPending: 'Initializing the math engine. Math preview will become available shortly.',
    statusMathUnavailable: 'The math engine failed to initialize or is still unavailable. Editing can continue.',
    statusFileProtocol: 'Opened through file://. For stable math preview, see “2.1 Local startup” in the user manual.',
    noDiagnostics: 'No critical issue detected at the moment.',
    unsupported: 'Unsupported',
    lineRange: 'Lines',
    confirmLoseChanges: 'You have unsaved changes. Continuing will discard the current content.',
    openFailed: 'Failed to read the file.',
    saveFailed: 'Failed to save the file.',
    printFailed: 'Could not open the print window.',
    browserWarning: 'You have unsaved changes.',
    localeName: 'English',
    severityError: 'Error',
    severityWarning: 'Warning',
    severityInfo: 'Info',
    diagUnclosedEnv: 'Environment is not closed.',
    diagUnsupportedEnv: 'This environment is not supported in v1.',
    diagOddDollar: 'An inline math $ delimiter may be left open.',
    diagMacroSyntax: 'Could not parse the macro definition.',
    diagMacroArgs: 'Argumented \\newcommand is not supported in v1.',
    diagMacroDuplicate: 'The later macro overrides the earlier definition.',
    diagMacroReserved: 'Built-in macro names cannot be overridden.',
    diagArchive: 'Could not parse the .texs archive.',
    diagUnsupportedZip: 'This .texs archive may use a different format than this v1 app.',
    diagEqnarray: 'eqnarray is previewed through the compatibility layer as align.',
    diagUnknownBlock: 'Unknown blocks are rendered as-is.',
    diagFileProtocol: 'file:// opening can make math preview unstable. See “2.1 Local startup” in the user manual for the local server workflow.',
    diagMathJaxUnavailable: 'The math engine is unavailable or still pending. Raw math source may remain visible in the preview.',
    diagMathNestedEnv: 'This \\begin / \\end cannot appear inside a math environment.',
    diagMathItem: '\\item cannot appear inside a math environment.',
    diagItemOutsideList: '\\item cannot appear outside itemize / enumerate.',
    diagIllegalHash: '# cannot appear outside macro definitions.',
    diagFracSyntax: 'Use \\frac{numerator}{denominator} after \\frac.',
    diagUnknownMathCommand: 'This math command looks undefined or unsupported.',
    diagUnknownTextCommand: 'This command looks unsupported or out of place here.',
    adminAppEntry: 'Public entry point',
    adminOfflineReady: 'Bundled libraries included',
    fileProtocolTitle: 'Some features are unstable when opened through file://.',
    fileProtocolBody: 'Use a small static server for stable startup. See “2.1 Local startup” and “10. Known limitations” in the user manual.',
    fileProtocolCommandLabel: 'Recommended command',
    fileProtocolCommand: 'python3 -m http.server 8000',
    fileProtocolUrl: 'http://127.0.0.1:8000/app/',
    fileProtocolDocLabel: 'Local startup help',
    aboutDialogTitle: 'About KakuTeX',
    aboutTagline: 'TeX subset memo app',
    aboutVersionLabel: 'Version',
    aboutStartedLabel: 'Development started',
    aboutAuthorLabel: 'Author',
    aboutLinkLabel: 'Web',
    aboutDisclaimerLabel: 'Disclaimer',
    aboutDisclaimerText: 'Open usage notes and disclaimer',
    aboutClose: 'Close'
  }
};
function t(locale, key) {
  return STRINGS[locale]?.[key] ?? STRINGS.ja[key] ?? key;
}
function getStrings(locale) {
  return STRINGS[locale] ?? STRINGS.ja;
}
    return { t: t, getStrings: getStrings };
  };
  __factories['./macros.js'] = function (__load) {
const { BUILTIN_MACROS } = __load('./config.js');
const { stripComment } = __load('./utils.js');
const MACRO_RE = /^\\newcommand\s*\{\\([A-Za-z@]+)\}\s*(?:\[(\d+)\])?\s*\{([\s\S]*)\}\s*$/;
const RESERVED_NAMES = new Set(Object.keys(BUILTIN_MACROS));
function parseMacros(source) {
  const diagnostics = [];
  const map = {};
  const rawLines = String(source ?? '').split(/\n/);

  for (let index = 0; index < rawLines.length; index += 1) {
    const raw = rawLines[index];
    const text = stripComment(raw).trim();
    if (!text) continue;
    const match = text.match(MACRO_RE);
    if (!match) {
      diagnostics.push({
        severity: 'warning',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroSyntax',
        detail: raw
      });
      continue;
    }
    const [, name, argCount, body] = match;
    if (argCount && Number(argCount) > 0) {
      diagnostics.push({
        severity: 'warning',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroArgs',
        detail: `\\${name}`
      });
      continue;
    }
    if (RESERVED_NAMES.has(name)) {
      diagnostics.push({
        severity: 'warning',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroReserved',
        detail: `\\${name}`
      });
      continue;
    }
    if (Object.hasOwn(map, name)) {
      diagnostics.push({
        severity: 'info',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroDuplicate',
        detail: `\\${name}`
      });
    }
    map[name] = body;
  }

  return {
    macros: map,
    builtins: BUILTIN_MACROS,
    diagnostics
  };
}
function mergedMathJaxMacros(userMacros) {
  return {
    ...Object.fromEntries(Object.entries(userMacros).map(([name, body]) => [name, body])),
    ...BUILTIN_MACROS
  };
}
    return { parseMacros: parseMacros, mergedMathJaxMacros: mergedMathJaxMacros };
  };
  __factories['./main.js'] = function (__load) {
const { APP_VERSION, DEFAULT_BODY, DEFAULT_FILE_NAME, DEFAULT_MACROS, INPUT_ASSIST_SNIPPETS } = __load('./config.js');
const { buildAutosavePayload, collectAllDiagnostics, createInitialState, decorateBlocks, flattenBlocks, snapshotSignature } = __load('./app-state.js');
const { getStrings, t } = __load('./i18n.js');
const { waitForMathJax, updateMathJaxMacros, typesetPreview } = __load('./mathjax-bridge.js');
const { parseMacros } = __load('./macros.js');
const { parseDocument } = __load('./parser.js');
const { renderPreview } = __load('./renderer.js');
const { loadAutosave, saveAutosave } = __load('./storage.js');
const { exportTexFile } = __load('./tex-export.js');
const { buildTexsArchive, parseTexsArchive } = __load('./texs-archive.js');
const { applyRuntimeStatus, getElements, localizeStaticUi, openAboutDialog, renderDiagnostics, updateAssistUi, updateDirtyIndicator, updateFilenameChip } = __load('./ui-shell.js');
const { clamp, debounce, normalizeNewlines, saveBlob, todayIso } = __load('./utils.js');
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
    return {  };
  };
  __factories['./mathjax-bridge.js'] = function (__load) {
const { mergedMathJaxMacros } = __load('./macros.js');
async function waitForMathJax({ timeoutMs = 4000 } = {}) {
  const startupPromise = window.MathJax?.startup?.promise;
  if (!startupPromise) return false;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    await startupPromise;
    return true;
  }
  await Promise.race([
    startupPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('MathJax startup timeout')), timeoutMs))
  ]);
  return true;
}
function updateMathJaxMacros(userMacros) {
  const macros = mergedMathJaxMacros(userMacros);
  if (window.MathJax?.config?.tex) {
    window.MathJax.config.tex.macros = macros;
  }
  if (window.MathJax?.tex) {
    window.MathJax.tex.macros = macros;
  }
  const parseOptions = window.MathJax?.startup?.document?.inputJax?.parseOptions?.options;
  if (parseOptions) {
    parseOptions.macros = macros;
  }
}

function normalizeMathErrorMessage(message) {
  return String(message ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^Math input error:?\s*/i, '')
    .trim();
}

function collectMathJaxDiagnostics(node) {
  const diagnostics = [];
  const seen = new Set();
  const errors = node.querySelectorAll('[data-mjx-error], mjx-merror');
  errors.forEach((entry) => {
    const block = entry.closest('.preview-block');
    const lineStart = Number.parseInt(block?.dataset?.lineStart ?? '1', 10) || 1;
    const lineEnd = Number.parseInt(block?.dataset?.lineEnd ?? String(lineStart), 10) || lineStart;
    const rawMessage = entry.getAttribute?.('data-mjx-error') || entry.dataset?.mjxError || entry.textContent || 'MathJax render error';
    const detail = normalizeMathErrorMessage(rawMessage);
    const signature = `${lineStart}:${lineEnd}:${detail}`;
    if (!detail || seen.has(signature)) return;
    seen.add(signature);
    diagnostics.push({
      key: 'diagMathRenderError',
      severity: 'error',
      lineStart,
      lineEnd,
      detail
    });
  });
  return diagnostics;
}
async function typesetPreview(node) {
  if (!window.MathJax?.typesetPromise) return [];
  const targets = Array.from(node.querySelectorAll('.math-block-source, .inline-math-source'));
  if (!targets.length) return [];
  window.MathJax.typesetClear?.(targets);
  await window.MathJax.typesetPromise(targets);
  return collectMathJaxDiagnostics(node);
}
    return { waitForMathJax: waitForMathJax, updateMathJaxMacros: updateMathJaxMacros, typesetPreview: typesetPreview };
  };
  __factories['./parser.js'] = function (__load) {
const { HEADING_COMMANDS, LIST_ENVS, SUPPORTED_MATH_ENVS, TEXT_COMMAND_REPLACEMENTS } = __load('./config.js');
const { countUnescapedInlineDollars, linesWithOffsets, stripComment } = __load('./utils.js');
function headingLevelFor(command) {
  return {
    section: 1,
    subsection: 2,
    subsubsection: 3,
    paragraph: 4
  }[command] ?? 1;
}

function headingRegex(command) {
  return new RegExp(`^\\\\${command}\\{([\\s\\S]*)\\}(.*)$`);
}

class LineStream {
  constructor(text) {
    const { lines, offsets } = linesWithOffsets(text);
    this.lines = lines;
    this.offsets = offsets;
    this.index = 0;
  }

  eof() {
    return this.index >= this.lines.length;
  }

  peek(offset = 0) {
    return this.lines[this.index + offset] ?? null;
  }

  currentLineNumber() {
    return this.index + 1;
  }

  advance(step = 1) {
    this.index += step;
  }

  rawLineAt(lineNumber) {
    return this.lines[lineNumber - 1] ?? '';
  }

  offsetForLine(lineNumber) {
    return this.offsets[lineNumber - 1] ?? 0;
  }

  endOffsetForLine(lineNumber) {
    const idx = lineNumber - 1;
    return (this.offsets[idx] ?? 0) + (this.lines[idx]?.length ?? 0);
  }
}

function makeBlock(type, lineStart, lineEnd, offsetStart, offsetEnd, data = {}) {
  return { type, lineStart, lineEnd, offsetStart, offsetEnd, ...data };
}

function createDiagnostic(key, severity, lineStart, lineEnd, detail = '') {
  return { key, severity, lineStart, lineEnd, detail };
}

function isBlank(line) {
  return stripComment(line ?? '').trim() === '';
}

function matchHeading(line) {
  const trimmed = stripComment(line ?? '').trim();
  for (const command of HEADING_COMMANDS) {
    const match = trimmed.match(headingRegex(command));
    if (match) {
      return {
        command,
        level: headingLevelFor(command),
        title: match[1].trim(),
        trailing: match[2].trim()
      };
    }
  }
  return null;
}

function matchBeginEnv(line) {
  const trimmed = stripComment(line ?? '').trim();
  const match = trimmed.match(/^\\begin\{([^}]+)\}/);
  if (!match) return null;
  return match[1];
}

function matchEndEnv(line) {
  const trimmed = stripComment(line ?? '').trim();
  const match = trimmed.match(/^\\end\{([^}]+)\}/);
  if (!match) return null;
  return match[1];
}

function collectUntilEnd(stream, envName) {
  const startLine = stream.currentLineNumber();
  const lines = [];
  let endLine = startLine;
  while (!stream.eof()) {
    const raw = stream.peek();
    lines.push(raw);
    endLine = stream.currentLineNumber();
    const closed = matchEndEnv(raw) === envName;
    stream.advance();
    if (closed) {
      return { lines, startLine, endLine, closed: true };
    }
  }
  return { lines, startLine, endLine, closed: false };
}

const COMMON_MATH_COMMANDS = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma',
  'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  'sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'sinh', 'cosh', 'tanh', 'arcsin', 'arccos', 'arctan',
  'log', 'ln', 'exp', 'det', 'dim', 'ker', 'min', 'max', 'sup', 'inf', 'lim', 'operatorname',
  'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'boldsymbol', 'vec', 'hat', 'bar', 'tilde',
  'dot', 'ddot', 'overline', 'underline', 'left', 'right', 'bigl', 'bigr', 'Bigl', 'Bigr',
  'frac', 'dfrac', 'tfrac', 'sqrt', 'sum', 'prod', 'int', 'iint', 'iiint', 'oint', 'partial',
  'cdot', 'times', 'pm', 'mp', 'leq', 'geq', 'neq', 'approx', 'sim', 'to', 'rightarrow', 'leftarrow',
  'mapsto', 'infty', 'ldots', 'cdots', 'vdots', 'ddots', 'qquad', 'quad', 'text', 'label', 'tag',
  'begin', 'end', 'not', 'slashed', 'LaTeX', 'TeX'
]);

function hasUnescapedHash(text) {
  const source = String(text ?? '');
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== '#') continue;
    let backslashes = 0;
    for (let j = i - 1; j >= 0 && source[j] === '\\'; j -= 1) backslashes += 1;
    if (backslashes % 2 === 0) return true;
  }
  return false;
}

function extractInlineMathBodies(text) {
  const source = String(text ?? '');
  const parts = [];
  let i = 0;
  while (i < source.length) {
    if (source[i] === '$' && source[i + 1] !== '$') {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '$' && source[j - 1] !== '\\') break;
        j += 1;
      }
      if (j < source.length) {
        parts.push(source.slice(i + 1, j));
        i = j + 1;
        continue;
      }
    }
    if (source[i] === '\\' && source[i + 1] === '(') {
      let j = i + 2;
      while (j < source.length - 1) {
        if (source[j] === '\\' && source[j + 1] === ')' && source[j - 1] !== '\\') break;
        j += 1;
      }
      if (j < source.length - 1) {
        parts.push(source.slice(i + 2, j));
        i = j + 2;
        continue;
      }
    }
    i += 1;
  }
  return parts;
}

function inspectMathSource(source, lineStart, lineEnd, userMacros = {}, options = {}) {
  const diagnostics = [];
  const macroNames = new Set(Object.keys(userMacros ?? {}));
  const ignoreCommands = options.ignoreCommands ?? new Set();
  const text = String(source ?? '');
  const seenUnknown = new Set();

  if (hasUnescapedHash(text)) {
    diagnostics.push(createDiagnostic('diagIllegalHash', 'error', lineStart, lineEnd, '#'));
  }
  if (/\\(?:dfrac|tfrac|frac)(?!\s*\{)/.test(text)) {
    diagnostics.push(createDiagnostic('diagFracSyntax', 'error', lineStart, lineEnd, '\\frac'));
  }

  const commandRe = /\\([A-Za-z]+)\b/g;
  let match;
  while ((match = commandRe.exec(text)) !== null) {
    const name = match[1];
    if (COMMON_MATH_COMMANDS.has(name) || macroNames.has(name) || ignoreCommands.has(name)) continue;
    if (seenUnknown.has(name)) continue;
    seenUnknown.add(name);
    diagnostics.push(createDiagnostic('diagUnknownMathCommand', 'error', lineStart, lineEnd, `\\${name}`));
  }

  return diagnostics;
}

function collectDelimitedMath(stream, startToken, endToken) {
  const startLine = stream.currentLineNumber();
  const lines = [];
  let endLine = startLine;
  let closed = false;
  while (!stream.eof()) {
    const raw = stream.peek();
    lines.push(raw);
    endLine = stream.currentLineNumber();
    const stripped = stripComment(raw);
    stream.advance();
    if (stripped.includes(endToken) && (startLine !== endLine || stripped.indexOf(endToken) > stripped.indexOf(startToken))) {
      closed = true;
      break;
    }
  }
  return { lines, startLine, endLine, closed };
}

function transformEqnarray(raw) {
  const renamed = raw
    .replace(/\\begin\{eqnarray\*\}/, '\\begin{align*}')
    .replace(/\\end\{eqnarray\*\}/, '\\end{align*}')
    .replace(/\\begin\{eqnarray\}/, '\\begin{align}')
    .replace(/\\end\{eqnarray\}/, '\\end{align}');
  return renamed
    .replace(/&\s*=\s*&/g, '&=')
    .replace(/&\s*\\leq\s*&/g, '&\\leq')
    .replace(/&\s*\\geq\s*&/g, '&\\geq');
}

function inspectMathEnvironment(lines, envName, startLine, lineOffset, userMacros = {}) {
  const diagnostics = [];
  const lastIndex = lines.length - 1;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const stripped = stripComment(raw).trim();
    if (!stripped) continue;
    const isBoundaryLine = index === 0 || index === lastIndex;
    const beginEnv = matchBeginEnv(raw);
    const endEnv = matchEndEnv(raw);
    const absoluteLine = startLine + index + lineOffset;

    if (beginEnv && (!isBoundaryLine || beginEnv !== envName) && !SUPPORTED_MATH_ENVS.has(beginEnv)) {
      diagnostics.push(createDiagnostic('diagMathNestedEnv', 'error', absoluteLine, absoluteLine, `\\begin{${beginEnv}}`));
    }

    if (endEnv && (!isBoundaryLine || endEnv !== envName) && !SUPPORTED_MATH_ENVS.has(endEnv)) {
      diagnostics.push(createDiagnostic('diagMathNestedEnv', 'error', absoluteLine, absoluteLine, `\\end{${endEnv}}`));
    }

    if (/^\\item\b/.test(stripped)) {
      diagnostics.push(createDiagnostic('diagMathItem', 'error', absoluteLine, absoluteLine, '\\item'));
    }

    if (!isBoundaryLine) {
      diagnostics.push(...inspectMathSource(stripped, absoluteLine, absoluteLine, userMacros, { ignoreCommands: new Set([envName.replace(/\*$/, '')]) }));
    }
  }
  return diagnostics;
}

function inspectParagraphLines(lines, startLine, lineOffset, userMacros = {}) {
  const diagnostics = [];
  for (let index = 0; index < lines.length; index += 1) {
    const stripped = stripComment(lines[index]).trim();
    if (!stripped) continue;
    const absoluteLine = startLine + index + lineOffset;
    if (/^\\item\b/.test(stripped)) {
      diagnostics.push(createDiagnostic('diagItemOutsideList', 'error', absoluteLine, absoluteLine, '\\item'));
      continue;
    }
    if (hasUnescapedHash(stripped)) {
      diagnostics.push(createDiagnostic('diagIllegalHash', 'error', absoluteLine, absoluteLine, '#'));
      continue;
    }
    if (/^\\(?:dfrac|tfrac|frac)(?:_|\s|$)/.test(stripped) && !/^\\(?:dfrac|tfrac|frac)\s*\{/.test(stripped)) {
      diagnostics.push(createDiagnostic('diagFracSyntax', 'error', absoluteLine, absoluteLine, stripped));
      continue;
    }
    const commandAtStart = stripped.match(/^\\([A-Za-z]+)\b/);
    if (commandAtStart && !matchHeading(stripped) && !matchBeginEnv(stripped) && !matchEndEnv(stripped)) {
      const name = commandAtStart[1];
      if (!Object.hasOwn(userMacros ?? {}, name) && !Object.hasOwn(TEXT_COMMAND_REPLACEMENTS ?? {}, name)) {
        diagnostics.push(createDiagnostic('diagUnknownTextCommand', 'warning', absoluteLine, absoluteLine, `\\${name}`));
      }
    }
    for (const body of extractInlineMathBodies(stripped)) {
      diagnostics.push(...inspectMathSource(body, absoluteLine, absoluteLine, userMacros));
    }
  }
  return diagnostics;
}

function parseParagraph(stream) {
  const startLine = stream.currentLineNumber();
  const lines = [];
  while (!stream.eof()) {
    const raw = stream.peek();
    if (isBlank(raw)) break;
    if (matchHeading(raw)) break;
    const beginEnv = matchBeginEnv(raw);
    if (beginEnv || stripComment(raw).trim().startsWith('$$') || stripComment(raw).trim().startsWith('\\[')) break;
    lines.push(stripComment(raw).replace(/\s+$/, ''));
    stream.advance();
  }
  const joined = lines.join('\n').trim();
  const endLine = Math.max(startLine, stream.currentLineNumber() - 1);
  return { text: joined, startLine, endLine };
}

function parseList(stream, envName, diagnostics, userMacros = {}) {
  const beginLine = stream.currentLineNumber();
  stream.advance();
  const items = [];
  let closed = false;

  while (!stream.eof()) {
    const raw = stream.peek();
    const stripped = stripComment(raw).trim();
    if (!stripped) {
      stream.advance();
      continue;
    }
    if (matchEndEnv(raw) === envName) {
      closed = true;
      const endLine = stream.currentLineNumber();
      stream.advance();
      return { items, beginLine, endLine, closed };
    }
    if (!stripped.startsWith('\\item')) {
      diagnostics.push(createDiagnostic('diagUnknownBlock', 'info', stream.currentLineNumber(), stream.currentLineNumber(), stripped));
      stream.advance();
      continue;
    }
    const itemStart = stream.currentLineNumber();
    const firstLine = stripped.replace(/^\\item\s*/, '');
    stream.advance();
    const itemLines = [];
    if (firstLine) itemLines.push(firstLine);
    let depth = 0;
    while (!stream.eof()) {
      const look = stream.peek();
      const lookStripped = stripComment(look).trim();
      const beginEnv = matchBeginEnv(look);
      const endEnv = matchEndEnv(look);
      if (depth === 0 && (lookStripped.startsWith('\\item') || endEnv === envName)) {
        break;
      }
      if (LIST_ENVS.has(beginEnv)) depth += 1;
      if (LIST_ENVS.has(endEnv) && depth > 0) depth -= 1;
      itemLines.push(look);
      stream.advance();
    }
    const itemText = itemLines.join('\n');
    const parsed = parseDocument(itemText, { lineOffset: itemStart - 1, userMacros });
    items.push({
      lineStart: itemStart,
      lineEnd: itemStart + itemLines.length,
      blocks: parsed.blocks,
      diagnostics: parsed.diagnostics
    });
    diagnostics.push(...parsed.diagnostics);
  }

  return { items, beginLine, endLine: stream.currentLineNumber(), closed };
}
function parseDocument(text, options = {}) {
  const stream = new LineStream(text);
  const diagnostics = [];
  const blocks = [];
  const lineOffset = options.lineOffset ?? 0;
  const userMacros = options.userMacros ?? {};

  while (!stream.eof()) {
    const raw = stream.peek();
    const lineNumber = stream.currentLineNumber();

    if (isBlank(raw)) {
      stream.advance();
      continue;
    }

    const heading = matchHeading(raw);
    if (heading) {
      const offsetStart = stream.offsetForLine(lineNumber);
      const offsetEnd = stream.endOffsetForLine(lineNumber);
      blocks.push(makeBlock(
        'heading',
        lineNumber + lineOffset,
        lineNumber + lineOffset,
        offsetStart,
        offsetEnd,
        { level: heading.level, title: heading.title }
      ));
      stream.advance();
      if (heading.trailing) {
        blocks.push(makeBlock(
          'paragraph',
          lineNumber + lineOffset,
          lineNumber + lineOffset,
          offsetStart,
          offsetEnd,
          { text: heading.trailing }
        ));
      }
      continue;
    }

    const beginEnv = matchBeginEnv(raw);
    if (beginEnv && LIST_ENVS.has(beginEnv)) {
      const parsedList = parseList(stream, beginEnv, diagnostics, userMacros);
      const offsetStart = stream.offsetForLine(parsedList.beginLine);
      const offsetEnd = stream.endOffsetForLine(parsedList.endLine);
      blocks.push(makeBlock(
        'list',
        parsedList.beginLine + lineOffset,
        parsedList.endLine + lineOffset,
        offsetStart,
        offsetEnd,
        { envName: beginEnv, items: parsedList.items }
      ));
      if (!parsedList.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', parsedList.beginLine + lineOffset, parsedList.endLine + lineOffset, beginEnv));
      }
      continue;
    }

    if (beginEnv && SUPPORTED_MATH_ENVS.has(beginEnv)) {
      const collected = collectUntilEnd(stream, beginEnv);
      let rawText = collected.lines.join('\n');
      if (beginEnv.startsWith('eqnarray')) {
        rawText = transformEqnarray(rawText);
        diagnostics.push(createDiagnostic('diagEqnarray', 'info', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      }
      diagnostics.push(...inspectMathEnvironment(collected.lines, beginEnv, collected.startLine, lineOffset, userMacros));
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      }
      blocks.push(makeBlock(
        'math',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: rawText, display: true, envName: beginEnv }
      ));
      continue;
    }

    if (beginEnv && !LIST_ENVS.has(beginEnv)) {
      const collected = collectUntilEnd(stream, beginEnv);
      const rawText = collected.lines.join('\n');
      diagnostics.push(createDiagnostic('diagUnsupportedEnv', 'warning', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      }
      blocks.push(makeBlock(
        'unsupported',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: rawText, envName: beginEnv }
      ));
      continue;
    }

    const stripped = stripComment(raw).trim();
    if (stripped.startsWith('$$')) {
      const collected = collectDelimitedMath(stream, '$$', '$$');
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, '$$'));
      }
      diagnostics.push(...inspectMathSource(collected.lines.join('\n'), collected.startLine + lineOffset, collected.endLine + lineOffset, userMacros));
      blocks.push(makeBlock(
        'math',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: collected.lines.join('\n'), display: true, envName: '$$' }
      ));
      continue;
    }

    if (stripped.startsWith('\\[')) {
      const collected = collectDelimitedMath(stream, '\\[', '\\]');
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, '\\['));
      }
      diagnostics.push(...inspectMathSource(collected.lines.join('\n'), collected.startLine + lineOffset, collected.endLine + lineOffset, userMacros));
      blocks.push(makeBlock(
        'math',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: collected.lines.join('\n'), display: true, envName: '\\[' }
      ));
      continue;
    }

    const paragraph = parseParagraph(stream);
    if (paragraph.text) {
      if (countUnescapedInlineDollars(paragraph.text) % 2 === 1) {
        diagnostics.push(createDiagnostic('diagOddDollar', 'warning', paragraph.startLine + lineOffset, paragraph.endLine + lineOffset, paragraph.text));
      }
      diagnostics.push(...inspectParagraphLines(paragraph.text.split('\n'), paragraph.startLine, lineOffset, userMacros));
      blocks.push(makeBlock(
        'paragraph',
        paragraph.startLine + lineOffset,
        paragraph.endLine + lineOffset,
        stream.offsetForLine(paragraph.startLine),
        stream.endOffsetForLine(paragraph.endLine),
        { text: paragraph.text }
      ));
    } else {
      stream.advance();
    }
  }

  return { blocks, diagnostics };
}
    return { parseDocument: parseDocument };
  };
  __factories['./preview-helpers.js'] = function (__load) {
const { TEXT_COMMAND_REPLACEMENTS } = __load('./config.js');
function isCommandLetter(ch) {
  return /[A-Za-z@]/.test(ch ?? '');
}

function isEscaped(text, index) {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}
function expandNoArgMacrosInMath(source, userMacros = {}, maxPasses = 6) {
  let current = String(source ?? '');
  const macroMap = Object.fromEntries(
    Object.entries(userMacros ?? {}).filter(([name, body]) => typeof name === 'string' && typeof body === 'string' && body.length > 0)
  );
  if (!Object.keys(macroMap).length) return current;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    let out = '';
    for (let i = 0; i < current.length;) {
      const ch = current[i];
      if (ch !== '\\') {
        out += ch;
        i += 1;
        continue;
      }
      const next = current[i + 1];
      if (!isCommandLetter(next)) {
        out += ch;
        i += 1;
        continue;
      }
      let j = i + 1;
      while (j < current.length && isCommandLetter(current[j])) {
        j += 1;
      }
      const name = current.slice(i + 1, j);
      if (Object.hasOwn(macroMap, name)) {
        out += macroMap[name];
        i = j;
        changed = true;
        continue;
      }
      out += current.slice(i, j);
      i = j;
    }
    current = out;
    if (!changed) break;
  }
  return current;
}
function tokenizeInlineMath(text, userMacros = {}) {
  const source = String(text ?? '');
  const tokens = [];
  let buffer = '';
  let i = 0;

  const flushText = () => {
    if (!buffer) return;
    tokens.push({ type: 'text', text: buffer });
    buffer = '';
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === '$' && !isEscaped(source, i) && source[i + 1] !== '$') {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '$' && !isEscaped(source, j) && source[j - 1] !== '$') break;
        j += 1;
      }
      if (j < source.length && source[j] === '$') {
        flushText();
        const body = source.slice(i + 1, j);
        tokens.push({
          type: 'math',
          source: `$${expandNoArgMacrosInMath(body, userMacros)}$`,
          delimiter: '$'
        });
        i = j + 1;
        continue;
      }
    }

    if (ch === '\\' && source[i + 1] === '(' && !isEscaped(source, i)) {
      let j = i + 2;
      while (j < source.length - 1) {
        if (source[j] === '\\' && source[j + 1] === ')' && !isEscaped(source, j)) break;
        j += 1;
      }
      if (j < source.length - 1 && source[j] === '\\' && source[j + 1] === ')') {
        flushText();
        const body = source.slice(i + 2, j);
        tokens.push({
          type: 'math',
          source: `\\(${expandNoArgMacrosInMath(body, userMacros)}\\)`,
          delimiter: '\\(\\)'
        });
        i = j + 2;
        continue;
      }
    }

    buffer += ch;
    i += 1;
  }

  flushText();
  return tokens;
}
function splitParagraphHardBreaks(text) {
  return String(text ?? '').split(/\\\\/);
}
function normalizeTextCommands(source) {
  const text = String(source ?? '');
  const entries = Object.entries(TEXT_COMMAND_REPLACEMENTS ?? {})
    .sort(([a], [b]) => b.length - a.length);
  if (!entries.length || !text.includes('\\')) return text;

  let out = '';
  for (let index = 0; index < text.length;) {
    if (text[index] !== '\\') {
      out += text[index];
      index += 1;
      continue;
    }

    let matched = false;
    for (const [name, replacement] of entries) {
      const command = `\\${name}`;
      if (!text.startsWith(command, index)) continue;
      const next = text[index + command.length];
      if (next && /[A-Za-z@]/.test(next)) continue;

      out += replacement;
      index += command.length;
      if (text.startsWith('{}', index)) index += 2;
      if (text[index] === '\\' && text[index + 1] === ' ') {
        out += ' ';
        index += 2;
      }
      matched = true;
      break;
    }

    if (!matched) {
      out += text[index];
      index += 1;
    }
  }
  return out;
}
function tokenizeTextCommands(source) {
  const text = String(source ?? '');
  const entries = Object.entries(TEXT_COMMAND_REPLACEMENTS ?? {})
    .sort(([a], [b]) => b.length - a.length);
  if (!entries.length || !text.includes('\\')) return text ? [{ type: 'text', text }] : [];

  const tokens = [];
  let buffer = '';
  const flush = () => {
    if (!buffer) return;
    tokens.push({ type: 'text', text: buffer });
    buffer = '';
  };

  for (let index = 0; index < text.length;) {
    if (text[index] !== '\\') {
      buffer += text[index];
      index += 1;
      continue;
    }

    let matched = false;
    for (const [name, replacement] of entries) {
      const command = `\\${name}`;
      if (!text.startsWith(command, index)) continue;
      const next = text[index + command.length];
      if (next && /[A-Za-z@]/.test(next)) continue;

      flush();
      tokens.push({ type: 'textCommand', name, text: replacement, source: `$\\${name}$` });
      index += command.length;
      if (text.startsWith('{}', index)) index += 2;
      if (text[index] === '\\' && text[index + 1] === ' ') {
        buffer += ' ';
        index += 2;
      }
      matched = true;
      break;
    }

    if (!matched) {
      buffer += text[index];
      index += 1;
    }
  }

  flush();
  return tokens;
}
function computeHeadingNumbers(blocks = []) {
  const counters = [0, 0, 0, 0];
  const labels = new Map();
  for (const block of blocks) {
    if (block?.type !== 'heading') continue;
    const level = Math.max(1, Math.min(4, Number(block.level) || 1));
    if (level === 4) {
      labels.set(block.blockId, '');
      continue;
    }
    for (let i = 0; i < level - 1; i += 1) {
      if (counters[i] === 0) counters[i] = 1;
    }
    counters[level - 1] += 1;
    for (let i = level; i < counters.length; i += 1) counters[i] = 0;
    labels.set(block.blockId, counters.slice(0, level).join('.'));
  }
  return labels;
}
    return { expandNoArgMacrosInMath: expandNoArgMacrosInMath, tokenizeInlineMath: tokenizeInlineMath, splitParagraphHardBreaks: splitParagraphHardBreaks, normalizeTextCommands: normalizeTextCommands, tokenizeTextCommands: tokenizeTextCommands, computeHeadingNumbers: computeHeadingNumbers };
  };
  __factories['./renderer.js'] = function (__load) {
const { computeHeadingNumbers, expandNoArgMacrosInMath, splitParagraphHardBreaks, tokenizeInlineMath, tokenizeTextCommands } = __load('./preview-helpers.js');
function makeBlockShell(document, block, classes = []) {
  const wrapper = document.createElement('section');
  wrapper.className = ['preview-block', ...classes, block.type === 'heading' ? `heading-level-${Math.min(4, block.level)}` : ''].filter(Boolean).join(' ');
  wrapper.dataset.blockId = block.blockId;
  wrapper.dataset.lineStart = String(block.lineStart);
  wrapper.dataset.lineEnd = String(block.lineEnd);
  return wrapper;
}


function appendTextSegment(parent, document, segment) {
  for (const token of tokenizeTextCommands(segment)) {
    if (token.type === 'textCommand') {
      const span = document.createElement('span');
      span.className = 'inline-math-source text-command-source';
      span.textContent = token.source;
      span.setAttribute('aria-label', token.text);
      parent.append(span);
      continue;
    }
    if (token.text) parent.append(document.createTextNode(token.text));
  }
}

function appendTextWithBreaks(parent, document, text) {
  const segments = splitParagraphHardBreaks(text);
  segments.forEach((segment, index) => {
    if (index > 0) parent.append(document.createElement('br'));
    if (segment) appendTextSegment(parent, document, segment);
  });
}

function appendInlineContent(parent, document, text, userMacros) {
  const tokens = tokenizeInlineMath(text, userMacros);
  for (const token of tokens) {
    if (token.type === 'text') {
      appendTextWithBreaks(parent, document, token.text);
      continue;
    }
    const span = document.createElement('span');
    span.className = 'inline-math-source';
    span.textContent = token.source;
    parent.append(span);
  }
}

function appendHeadingContent(heading, document, title, number, userMacros) {
  if (number) {
    const numberSpan = document.createElement('span');
    numberSpan.className = 'heading-number';
    numberSpan.textContent = `${number} `;
    heading.append(numberSpan);
  }
  appendInlineContent(heading, document, title, userMacros);
}

function renderNestedBlock(block, document, userMacros) {
  if (block.type === 'heading') {
    const heading = document.createElement(`h${Math.min(4, block.level)}`);
    appendInlineContent(heading, document, block.title, userMacros);
    return heading;
  }
  if (block.type === 'paragraph') {
    const p = document.createElement('p');
    appendInlineContent(p, document, block.text, userMacros);
    return p;
  }
  if (block.type === 'math') {
    const div = document.createElement('div');
    div.className = 'math-block-source';
    div.textContent = expandNoArgMacrosInMath(block.text, userMacros);
    return div;
  }
  if (block.type === 'unsupported') {
    const pre = document.createElement('pre');
    pre.textContent = block.text;
    return pre;
  }
  const div = document.createElement('div');
  div.textContent = block.text ?? '';
  return div;
}

function renderBlock(block, document, localeStrings, options) {
  const userMacros = options.userMacros ?? {};
  const headingNumbers = options.headingNumbers ?? new Map();

  if (block.type === 'heading') {
    const wrapper = makeBlockShell(document, block, ['heading']);
    const tag = `h${Math.min(4, block.level)}`;
    const heading = document.createElement(tag);
    appendHeadingContent(heading, document, block.title, headingNumbers.get(block.blockId), userMacros);
    wrapper.append(heading);
    return wrapper;
  }

  if (block.type === 'paragraph') {
    const wrapper = makeBlockShell(document, block, ['paragraph']);
    const p = document.createElement('p');
    appendInlineContent(p, document, block.text, userMacros);
    wrapper.append(p);
    return wrapper;
  }

  if (block.type === 'math') {
    const wrapper = makeBlockShell(document, block, ['math']);
    const div = document.createElement('div');
    div.className = 'math-block-source';
    div.textContent = expandNoArgMacrosInMath(block.text, userMacros);
    wrapper.append(div);
    return wrapper;
  }

  if (block.type === 'list') {
    const wrapper = makeBlockShell(document, block, ['list']);
    const list = document.createElement(block.envName === 'enumerate' ? 'ol' : 'ul');
    for (const item of block.items) {
      const li = document.createElement('li');
      for (const child of item.blocks) {
        li.append(renderNestedBlock(child, document, userMacros));
      }
      list.append(li);
    }
    wrapper.append(list);
    return wrapper;
  }

  const wrapper = makeBlockShell(document, block, ['unsupported']);
  const title = document.createElement('strong');
  title.textContent = localeStrings.unsupported;
  const pre = document.createElement('pre');
  pre.textContent = block.text;
  wrapper.append(title, pre);
  return wrapper;
}
function renderPreview(previewRoot, blocks, localeStrings, userMacros = {}) {
  previewRoot.replaceChildren();
  if (!blocks.length) {
    const empty = previewRoot.ownerDocument.createElement('div');
    empty.className = 'preview-empty';
    empty.textContent = localeStrings.emptyPreview;
    previewRoot.append(empty);
    return;
  }
  const headingNumbers = computeHeadingNumbers(blocks);
  for (const block of blocks) {
    previewRoot.append(renderBlock(block, previewRoot.ownerDocument, localeStrings, { userMacros, headingNumbers }));
  }
}
    return { renderPreview: renderPreview };
  };
  __factories['./storage.js'] = function (__load) {
const { APP_STORAGE_KEY } = __load('./config.js');
function saveAutosave(payload) {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload));
}
function loadAutosave() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
    return { saveAutosave: saveAutosave, loadAutosave: loadAutosave };
  };
  __factories['./tex-export.js'] = function (__load) {
const { EXPORT_TEX_NAME } = __load('./config.js');
const { normalizeNewlines, saveBlob } = __load('./utils.js');
function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(String(text ?? ''));
}
function buildExportedTex({ body, macros }) {
  const normalizedBody = normalizeNewlines(body).trimEnd();
  const normalizedMacros = normalizeNewlines(macros).trimEnd();
  const macroSection = normalizedMacros ? `${normalizedMacros}\n\n` : '';
  const needsJapanese = containsJapanese(normalizedBody) || containsJapanese(normalizedMacros);
  const japaneseSection = needsJapanese
    ? String.raw`\usepackage{iftex}
\ifLuaTeX
  \IfFileExists{luatexja.sty}{%
    \usepackage{luatexja}
  }{%
    \PackageWarningNoLine{KakuTeX}{Japanese text detected but luatexja.sty was not found}%
  }
\fi
`
    : '';
  const commentBlock = [
    '% Generated by KakuTeX',
    '% Recommended engines:',
    '% - Primary tested path: lualatex exported_file.tex',
    '% - If Japanese text is detected, luatexja is inserted only on the LuaLaTeX path.',
    '% - Alternative DVI path: uplatex exported_file.tex or platex exported_file.tex, then dvipdfmx exported_file.dvi.',
    '% - pxjahyper is not inserted by default. Add it only when you also add hyperref under (u)pLaTeX.'
  ].join('\n');

  return String.raw`${commentBlock}
\documentclass[11pt]{article}
${japaneseSection}\usepackage{amsmath,amssymb,mathtools}
\usepackage{slashed}
\usepackage{geometry}
\geometry{margin=25mm}
${macroSection}\begin{document}
${normalizedBody}
\end{document}
`;
}
async function exportTexFile(model, fileName = EXPORT_TEX_NAME) {
  const tex = buildExportedTex(model);
  const blob = new Blob([tex], { type: 'text/x-tex;charset=utf-8' });
  return saveBlob(blob, fileName, {
    types: [
      {
        description: 'TeX source',
        accept: {
          'text/x-tex': ['.tex'],
          'text/plain': ['.tex']
        }
      }
    ]
  });
}
    return { buildExportedTex: buildExportedTex, exportTexFile: exportTexFile };
  };
  __factories['./texs-archive.js'] = function (__load) {
const { APP_VERSION, DEFAULT_FILE_NAME } = __load('./config.js');
const { normalizeNewlines, serializeJson, todayIso } = __load('./utils.js');
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16LE(value) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32LE(value) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function concatArrays(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function encodeUtf8(text) {
  return new TextEncoder().encode(text);
}

function decodeUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}
function buildTexsArchive({ body, macros, ui, meta }) {
  const entries = [
    {
      name: 'body.tex',
      bytes: encodeUtf8(normalizeNewlines(body))
    },
    {
      name: 'macros.tex',
      bytes: encodeUtf8(normalizeNewlines(macros))
    },
    {
      name: 'ui.json',
      bytes: encodeUtf8(serializeJson(ui))
    },
    {
      name: 'meta.json',
      bytes: encodeUtf8(serializeJson({
        format: 'texs',
        version: 1,
        generator: `kakutex ${APP_VERSION}`,
        createdAt: meta?.createdAt ?? todayIso(),
        updatedAt: todayIso(),
        fileName: meta?.fileName ?? DEFAULT_FILE_NAME,
        ...meta
      }))
    }
  ];

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const crc = crc32(entry.bytes);
    const localHeader = new Uint8Array([
      ...uint32LE(0x04034b50),
      ...uint16LE(20),
      ...uint16LE(0x0800),
      ...uint16LE(0),
      ...uint16LE(0), ...uint16LE(0),
      ...uint32LE(crc),
      ...uint32LE(entry.bytes.length),
      ...uint32LE(entry.bytes.length),
      ...uint16LE(nameBytes.length),
      ...uint16LE(0)
    ]);
    const localRecord = concatArrays([localHeader, nameBytes, entry.bytes]);
    localParts.push(localRecord);

    const centralHeader = new Uint8Array([
      ...uint32LE(0x02014b50),
      ...uint16LE(20),
      ...uint16LE(20),
      ...uint16LE(0x0800),
      ...uint16LE(0),
      ...uint16LE(0), ...uint16LE(0),
      ...uint32LE(crc),
      ...uint32LE(entry.bytes.length),
      ...uint32LE(entry.bytes.length),
      ...uint16LE(nameBytes.length),
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint32LE(0),
      ...uint32LE(offset)
    ]);
    const centralRecord = concatArrays([centralHeader, nameBytes]);
    centralParts.push(centralRecord);
    offset += localRecord.length;
  }

  const centralDirectory = concatArrays(centralParts);
  const endRecord = new Uint8Array([
    ...uint32LE(0x06054b50),
    ...uint16LE(0), ...uint16LE(0),
    ...uint16LE(entries.length),
    ...uint16LE(entries.length),
    ...uint32LE(centralDirectory.length),
    ...uint32LE(offset),
    ...uint16LE(0)
  ]);

  return new Blob([concatArrays([...localParts, centralDirectory, endRecord])], { type: 'application/zip' });
}

function readU16(view, offset) {
  return view.getUint16(offset, true);
}

function readU32(view, offset) {
  return view.getUint32(offset, true);
}
async function parseTexsArchive(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (readU32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('EOCD not found');
  }

  const count = readU16(view, eocd + 10);
  const centralOffset = readU32(view, eocd + 16);
  let cursor = centralOffset;
  const entries = {};

  for (let i = 0; i < count; i += 1) {
    if (readU32(view, cursor) !== 0x02014b50) {
      throw new Error('Central directory entry missing');
    }
    const compression = readU16(view, cursor + 10);
    const compressedSize = readU32(view, cursor + 20);
    const fileNameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const commentLength = readU16(view, cursor + 32);
    const localOffset = readU32(view, cursor + 42);
    const nameBytes = bytes.slice(cursor + 46, cursor + 46 + fileNameLength);
    const name = decodeUtf8(nameBytes);

    if (readU32(view, localOffset) !== 0x04034b50) {
      throw new Error('Local header missing');
    }
    const localCompression = readU16(view, localOffset + 8);
    const localNameLength = readU16(view, localOffset + 26);
    const localExtraLength = readU16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;

    if (compression !== 0 || localCompression !== 0) {
      throw new Error('Only store method is supported in v1');
    }
    entries[name] = decodeUtf8(bytes.slice(dataStart, dataEnd));
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return {
    body: entries['body.tex'] ?? '',
    macros: entries['macros.tex'] ?? '',
    ui: entries['ui.json'] ? JSON.parse(entries['ui.json']) : {},
    meta: entries['meta.json'] ? JSON.parse(entries['meta.json']) : {}
  };
}
    return { buildTexsArchive: buildTexsArchive, parseTexsArchive: parseTexsArchive };
  };
  __factories['./ui-shell.js'] = function (__load) {
const { APP_AUTHOR_NAME, APP_AUTHOR_URL, APP_STARTED_AT, APP_VERSION } = __load('./config.js');
const { getManualTargets } = __load('./help-links.js');
const { getStrings, t } = __load('./i18n.js');
function setText(node, value) {
  if (node) node.textContent = String(value ?? '');
}
function getElements(doc = document) {
  return {
    bodyEditor: doc.getElementById('body-editor'),
    macroEditor: doc.getElementById('macro-editor'),
    preview: doc.getElementById('preview-surface'),
    diagnostics: doc.getElementById('diagnostics-list'),
    dirty: doc.getElementById('dirty-indicator'),
    status: doc.getElementById('status-message'),
    filenameChip: doc.getElementById('filename-chip'),
    fileInput: doc.getElementById('texs-file-input'),
    version: doc.getElementById('version-pill'),
    newBtn: doc.getElementById('new-note-btn'),
    openBtn: doc.getElementById('open-texs-btn'),
    saveBtn: doc.getElementById('save-texs-btn'),
    exportTexBtn: doc.getElementById('export-tex-btn'),
    exportPdfBtn: doc.getElementById('export-pdf-btn'),
    aboutBtn: doc.getElementById('about-btn'),
    helpBtn: doc.getElementById('help-btn'),
    undoBtn: doc.getElementById('undo-btn'),
    assistToggleBtn: doc.getElementById('assist-toggle-btn'),
    assistToolbar: doc.getElementById('assist-toolbar'),
    assistButtons: [...doc.querySelectorAll('[data-assist-key]')],
    localeBtn: doc.getElementById('locale-toggle-btn'),
    syncPreviewBtn: doc.getElementById('sync-to-preview-btn'),
    syncSourceBtn: doc.getElementById('sync-to-source-btn'),
    sourceTitle: doc.getElementById('source-pane-title'),
    sourceSubtitle: doc.getElementById('source-pane-subtitle'),
    previewTitle: doc.getElementById('preview-pane-title'),
    previewSubtitle: doc.getElementById('preview-pane-subtitle'),
    macroTitle: doc.getElementById('macro-panel-title'),
    macroSubtitle: doc.getElementById('macro-panel-subtitle'),
    diagnosticsTitle: doc.getElementById('diagnostics-title'),
    diagnosticsSubtitle: doc.getElementById('diagnostics-subtitle'),
    protocolWarning: doc.getElementById('protocol-warning'),
    protocolWarningTitle: doc.getElementById('protocol-warning-title'),
    protocolWarningBody: doc.getElementById('protocol-warning-body'),
    protocolWarningCommandLabel: doc.getElementById('protocol-warning-command-label'),
    protocolWarningCommand: doc.getElementById('protocol-warning-command'),
    protocolWarningUrl: doc.getElementById('protocol-warning-url'),
    protocolWarningDoc: doc.getElementById('protocol-warning-doc'),
    aboutDialog: doc.getElementById('about-dialog'),
    aboutCloseBtn: doc.getElementById('about-close-btn'),
    aboutOkBtn: doc.getElementById('about-ok-btn'),
    aboutDialogTitle: doc.getElementById('about-dialog-title'),
    aboutTagline: doc.getElementById('about-tagline'),
    aboutVersionLabel: doc.getElementById('about-version-label'),
    aboutVersionValue: doc.getElementById('about-version-value'),
    aboutStartedLabel: doc.getElementById('about-started-label'),
    aboutStartedValue: doc.getElementById('about-started-value'),
    aboutAuthorLabel: doc.getElementById('about-author-label'),
    aboutLinkLabel: doc.getElementById('about-link-label'),
    aboutDisclaimerLabel: doc.getElementById('about-disclaimer-label'),
    aboutDisclaimerLink: doc.getElementById('about-disclaimer-link'),
    aboutAuthorLink: doc.getElementById('about-author-link'),
    aboutHomeLink: doc.getElementById('about-home-link')
  };
}
function setOptionalText(node, value) {
  const text = String(value ?? '').trim();
  if (!node) return;
  node.textContent = text;
  node.hidden = text.length === 0;
}

function updateProtocolWarning(elements, locale, protocol) {
  const shouldShow = protocol === 'file:';
  if (!elements.protocolWarning) return;
  elements.protocolWarning.hidden = !shouldShow;
  if (!shouldShow) return;
  const s = getStrings(locale);
  const manual = getManualTargets(locale, 'local-startup');
  setText(elements.protocolWarningTitle, s.fileProtocolTitle);
  setText(elements.protocolWarningBody, s.fileProtocolBody);
  setText(elements.protocolWarningCommandLabel, s.fileProtocolCommandLabel);
  setText(elements.protocolWarningCommand, s.fileProtocolCommand);
  setText(elements.protocolWarningUrl, s.fileProtocolUrl);
  if (elements.protocolWarningUrl) elements.protocolWarningUrl.href = s.fileProtocolUrl;
  setText(elements.protocolWarningDoc, s.fileProtocolDocLabel);
  if (elements.protocolWarningDoc) elements.protocolWarningDoc.href = manual.htmlUrl;
}
function updateAboutDialog(elements, locale) {
  const resolvedLocale = getManualTargets(locale).locale;
  const s = getStrings(resolvedLocale);
  setText(elements.aboutDialogTitle, s.aboutDialogTitle);
  setText(elements.aboutTagline, s.aboutTagline);
  setText(elements.aboutVersionLabel, s.aboutVersionLabel);
  setText(elements.aboutVersionValue, `v${APP_VERSION}`);
  setText(elements.aboutStartedLabel, s.aboutStartedLabel);
  setText(elements.aboutStartedValue, APP_STARTED_AT);
  setText(elements.aboutAuthorLabel, s.aboutAuthorLabel);
  setText(elements.aboutLinkLabel, s.aboutLinkLabel);
  setText(elements.aboutDisclaimerLabel, s.aboutDisclaimerLabel);
  setText(elements.aboutDisclaimerLink, s.aboutDisclaimerText);
  if (elements.aboutDisclaimerLink) {
    const disclaimer = getManualTargets(resolvedLocale, 'disclaimer');
    elements.aboutDisclaimerLink.href = disclaimer.htmlUrl;
    elements.aboutDisclaimerLink.dataset.locale = disclaimer.locale;
    elements.aboutDisclaimerLink.title = s.aboutDisclaimerText;
    elements.aboutDisclaimerLink.setAttribute('aria-label', s.aboutDisclaimerText);
  }
  setText(elements.aboutAuthorLink, APP_AUTHOR_NAME);
  if (elements.aboutAuthorLink) elements.aboutAuthorLink.href = APP_AUTHOR_URL;
  setText(elements.aboutHomeLink, APP_AUTHOR_URL);
  if (elements.aboutHomeLink) {
    elements.aboutHomeLink.href = APP_AUTHOR_URL;
    elements.aboutHomeLink.setAttribute('aria-label', `${APP_AUTHOR_NAME} ${APP_AUTHOR_URL}`);
  }
  if (elements.aboutCloseBtn) elements.aboutCloseBtn.setAttribute('aria-label', s.aboutClose);
  setText(elements.aboutOkBtn, s.aboutClose);
}
function openAboutDialog(elements, locale) {
  updateAboutDialog(elements, locale);
  if (typeof elements.aboutDialog?.showModal === 'function') {
    elements.aboutDialog.showModal();
    return;
  }
  window.alert(`KakuTeX\nVersion: v${APP_VERSION}\nDevelopment started: ${APP_STARTED_AT}\nAuthor: ${APP_AUTHOR_NAME}\n${APP_AUTHOR_URL}`);
}
function updateDocumentTitle(fileName, doc = document) {
  const label = String(fileName ?? '').replace(/\.texs?$/i, '') || 'KakuTeX';
  doc.title = `${label} - KakuTeX`;
}
function updateFilenameChip(elements, locale, fileName, doc = document) {
  const s = getStrings(locale);
  setText(elements.filenameChip, `${s.filenameLabel}: ${fileName}`);
  updateDocumentTitle(fileName, doc);
}
function updateDirtyIndicator(elements, locale, dirty) {
  if (!elements.dirty) return;
  elements.dirty.hidden = !dirty;
  elements.dirty.textContent = t(locale, 'dirty');
}
function applyRuntimeStatus(elements, locale, statusKey) {
  setText(elements.status, t(locale, statusKey));
}
function renderDiagnostics(elements, locale, diagnostics) {
  const s = getStrings(locale);
  elements.diagnostics.replaceChildren();
  if (!diagnostics.length) {
    const card = elements.diagnostics.ownerDocument.createElement('div');
    card.className = 'diagnostic-card info';
    card.innerHTML = `<strong>${s.severityInfo}</strong><div>${s.noDiagnostics}</div>`;
    elements.diagnostics.append(card);
    return;
  }
  diagnostics.forEach((diag) => {
    const card = elements.diagnostics.ownerDocument.createElement('div');
    card.className = `diagnostic-card ${diag.severity}`;
    const title = elements.diagnostics.ownerDocument.createElement('strong');
    title.textContent = s[`severity${diag.severity[0].toUpperCase()}${diag.severity.slice(1)}`] ?? diag.severity;
    const body = elements.diagnostics.ownerDocument.createElement('div');
    const range = `${s.lineRange} ${diag.lineStart}${diag.lineEnd !== diag.lineStart ? `-${diag.lineEnd}` : ''}`;
    body.textContent = `${range}: ${t(locale, diag.key)} ${diag.detail ? `(${diag.detail})` : ''}`.trim();
    card.append(title, body);
    elements.diagnostics.append(card);
  });
}
function updateAssistUi(elements, locale, enabled) {
  const s = getStrings(locale);
  if (elements.assistToolbar) elements.assistToolbar.hidden = !enabled;
  if (elements.assistToggleBtn) {
    elements.assistToggleBtn.textContent = enabled ? s.assistDisable : s.assistEnable;
    elements.assistToggleBtn.setAttribute('aria-pressed', String(Boolean(enabled)));
  }
  if (Array.isArray(elements.assistButtons)) {
    elements.assistButtons.forEach((button) => {
      const key = button.dataset.assistKey;
      if (key) button.textContent = t(locale, key);
    });
  }
}
function localizeStaticUi(elements, locale, protocol, doc = document) {
  const s = getStrings(locale);
  setText(elements.newBtn, s.newNote);
  setText(elements.openBtn, s.openTexs);
  setText(elements.saveBtn, s.saveTexs);
  setText(elements.exportTexBtn, s.exportTex);
  setText(elements.exportPdfBtn, s.exportPdf);
  setText(elements.aboutBtn, s.aboutBtn);
  setText(elements.helpBtn, s.helpBtn);
  if (elements.helpBtn) {
    const helpTarget = getManualTargets(locale, 'basic-operations');
    elements.helpBtn.href = helpTarget.htmlUrl;
    elements.helpBtn.target = '_blank';
    elements.helpBtn.rel = 'noopener noreferrer';
  }
  setText(elements.undoBtn, s.undoBtn);
  setText(elements.localeBtn, s.localeToggle);
  setText(elements.syncPreviewBtn, s.syncToPreview);
  elements.syncPreviewBtn.title = s.syncToPreviewTitle ?? s.syncToPreview;
  elements.syncPreviewBtn.setAttribute('aria-label', s.syncToPreviewTitle ?? s.syncToPreview);
  setText(elements.syncSourceBtn, s.syncToSource);
  elements.syncSourceBtn.title = s.syncToSourceTitle ?? s.syncToSource;
  elements.syncSourceBtn.setAttribute('aria-label', s.syncToSourceTitle ?? s.syncToSource);
  setText(elements.sourceTitle, s.sourceTitle);
  setOptionalText(elements.sourceSubtitle, s.sourceSubtitle);
  setText(elements.previewTitle, s.previewTitle);
  setOptionalText(elements.previewSubtitle, s.previewSubtitle);
  setText(elements.macroTitle, s.macroTitle);
  setOptionalText(elements.macroSubtitle, s.macroSubtitle);
  setText(elements.diagnosticsTitle, s.diagnosticsTitle);
  setOptionalText(elements.diagnosticsSubtitle, s.diagnosticsSubtitle);
  doc.documentElement.lang = locale;
  setText(elements.version, `v${APP_VERSION}`);
  updateProtocolWarning(elements, locale, protocol);
  updateAboutDialog(elements, locale);
  updateAssistUi(elements, locale, false);
}
    return { getElements: getElements, setOptionalText: setOptionalText, updateAboutDialog: updateAboutDialog, openAboutDialog: openAboutDialog, updateDocumentTitle: updateDocumentTitle, updateFilenameChip: updateFilenameChip, updateDirtyIndicator: updateDirtyIndicator, applyRuntimeStatus: applyRuntimeStatus, renderDiagnostics: renderDiagnostics, updateAssistUi: updateAssistUi, localizeStaticUi: localizeStaticUi };
  };
  __factories['./utils.js'] = function (__load) {
function stripComment(line) {
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
function linesWithOffsets(text) {
  const lines = text.split(/\n/);
  const offsets = [];
  let cursor = 0;
  for (const line of lines) {
    offsets.push(cursor);
    cursor += line.length + 1;
  }
  return { lines, offsets };
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function debounce(fn, ms = 300) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
function countUnescapedInlineDollars(text) {
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
function readText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
async function saveBlob(blob, fileName, options = {}) {
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
function normalizeNewlines(text) {
  return String(text ?? '').replace(/\r\n?/g, '\n');
}
function serializeJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}
function todayIso() {
  return new Date().toISOString();
}
    return { stripComment: stripComment, linesWithOffsets: linesWithOffsets, clamp: clamp, delay: delay, debounce: debounce, escapeHtml: escapeHtml, countUnescapedInlineDollars: countUnescapedInlineDollars, readText: readText, downloadBlob: downloadBlob, saveBlob: saveBlob, normalizeNewlines: normalizeNewlines, serializeJson: serializeJson, todayIso: todayIso };
  };
  __load('./main.js');
}());
