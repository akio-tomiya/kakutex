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

export function getManualTargets(locale, anchor = '') {
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
