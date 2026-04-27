import { mergedMathJaxMacros } from './macros.js';

export async function waitForMathJax({ timeoutMs = 4000 } = {}) {
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

export function updateMathJaxMacros(userMacros) {
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

export async function typesetPreview(node) {
  if (!window.MathJax?.typesetPromise) return [];
  const targets = Array.from(node.querySelectorAll('.math-block-source, .inline-math-source'));
  if (!targets.length) return [];
  window.MathJax.typesetClear?.(targets);
  await window.MathJax.typesetPromise(targets);
  return collectMathJaxDiagnostics(node);
}
