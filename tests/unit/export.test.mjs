import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExportedTex } from '../../app/src/tex-export.js';

test('buildExportedTex keeps English export lightweight and includes slashed', () => {
  const tex = buildExportedTex({ body: '\\section{A}', macros: '\\newcommand{\\Tr}{\\operatorname{Tr}}' });
  assert.doesNotMatch(tex, /\\usepackage\{luatexja\}/);
  assert.match(tex, /slashed/);
  assert.match(tex, /\\begin\{document\}/);
});

test('buildExportedTex conditionally includes luatexja when Japanese text is present', () => {
  const tex = buildExportedTex({ body: '\\section{導入} 日本語です。', macros: '' });
  assert.match(tex, /luatexja/);
  assert.match(tex, /IfFileExists\{luatexja\.sty\}/);
  assert.match(tex, /pxjahyper/);
});
