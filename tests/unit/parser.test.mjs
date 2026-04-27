import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from '../../app/src/parser.js';

test('parseDocument detects headings, paragraphs, math, and lists', () => {
  const input = String.raw`\section{A}
Hello $x$.

\begin{align}
a&=b
\end{align}

\begin{itemize}
\item One
\item Two
\end{itemize}`;
  const parsed = parseDocument(input);
  assert.equal(parsed.blocks[0].type, 'heading');
  assert.equal(parsed.blocks[1].type, 'paragraph');
  assert.equal(parsed.blocks[2].type, 'math');
  assert.equal(parsed.blocks[3].type, 'list');
  assert.equal(parsed.blocks[3].items.length, 2);
});

test('parseDocument flags unclosed environments', () => {
  const input = String.raw`\begin{align}
a&=b`;
  const parsed = parseDocument(input);
  assert.equal(parsed.blocks[0].type, 'math');
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagUnclosedEnv'));
});

test('parseDocument converts eqnarray to math block and emits compatibility info', () => {
  const input = String.raw`\begin{eqnarray}
a & = & b
\end{eqnarray}`;
  const parsed = parseDocument(input);
  assert.equal(parsed.blocks[0].type, 'math');
  assert.match(parsed.blocks[0].text, /align/);
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagEqnarray'));
});

test('parseDocument flags document environments nested inside math blocks', () => {
  const input = String.raw`\begin{align}
a &= b \\
\begin{enumerate}
\item item1
\end{enumerate}
\end{align}`;
  const parsed = parseDocument(input);
  assert.equal(parsed.blocks[0].type, 'math');
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagMathNestedEnv' && diag.detail.includes('enumerate')));
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagMathItem'));
});

test('parseDocument flags stray list items, bare hashes, malformed frac, unknown math commands, and suspicious text commands', () => {
  const input = String.raw`$\info$
\item
#
\frac_
\alpha`;
  const parsed = parseDocument(input);
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagUnknownMathCommand' && diag.detail === '\\info'));
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagItemOutsideList'));
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagIllegalHash'));
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagFracSyntax'));
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagUnknownTextCommand' && diag.detail === '\\alpha'));
});

test('parseDocument respects user-defined no-argument macros during diagnostics', () => {
  const input = String.raw`$\Tr M = \Det A$`;
  const parsed = parseDocument(input, {
    userMacros: {
      Tr: String.raw`\operatorname{Tr}`,
      Det: String.raw`\operatorname{Det}`
    }
  });
  assert.equal(parsed.diagnostics.length, 0);
});

test('parseDocument accepts supported text commands such as LaTeX at paragraph start', () => {
  const parsed = parseDocument(String.raw`\LaTeX{} is supported in prose.`);
  assert.equal(parsed.diagnostics.some((diag) => diag.key === 'diagUnknownTextCommand'), false);
});

test('parseDocument accepts LaTeX and TeX text/math commands without diagnostics', () => {
  const parsed = parseDocument(String.raw`\LaTeX{}

\TeX

$\LaTeX{}$

$\LaTeX$

$\TeX$`);
  assert.equal(parsed.diagnostics.length, 0);
});
