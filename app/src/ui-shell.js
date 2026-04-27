import { APP_AUTHOR_NAME, APP_AUTHOR_URL, APP_STARTED_AT, APP_VERSION } from './config.js';
import { getManualTargets } from './help-links.js';
import { getStrings, t } from './i18n.js';

function setText(node, value) {
  if (node) node.textContent = String(value ?? '');
}

export function getElements(doc = document) {
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

export function setOptionalText(node, value) {
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

export function updateAboutDialog(elements, locale) {
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

export function openAboutDialog(elements, locale) {
  updateAboutDialog(elements, locale);
  if (typeof elements.aboutDialog?.showModal === 'function') {
    elements.aboutDialog.showModal();
    return;
  }
  window.alert(`KakuTeX\nVersion: v${APP_VERSION}\nDevelopment started: ${APP_STARTED_AT}\nAuthor: ${APP_AUTHOR_NAME}\n${APP_AUTHOR_URL}`);
}

export function updateDocumentTitle(fileName, doc = document) {
  const label = String(fileName ?? '').replace(/\.texs?$/i, '') || 'KakuTeX';
  doc.title = `${label} - KakuTeX`;
}

export function updateFilenameChip(elements, locale, fileName, doc = document) {
  const s = getStrings(locale);
  setText(elements.filenameChip, `${s.filenameLabel}: ${fileName}`);
  updateDocumentTitle(fileName, doc);
}

export function updateDirtyIndicator(elements, locale, dirty) {
  if (!elements.dirty) return;
  elements.dirty.hidden = !dirty;
  elements.dirty.textContent = t(locale, 'dirty');
}

export function applyRuntimeStatus(elements, locale, statusKey) {
  setText(elements.status, t(locale, statusKey));
}

export function renderDiagnostics(elements, locale, diagnostics) {
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


export function updateAssistUi(elements, locale, enabled) {
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

export function localizeStaticUi(elements, locale, protocol, doc = document) {
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
