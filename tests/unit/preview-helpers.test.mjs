import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHeadingNumbers, expandNoArgMacrosInMath, normalizeTextCommands, splitParagraphHardBreaks, tokenizeInlineMath, tokenizeTextCommands } from '../../app/src/preview-helpers.js';

test('expandNoArgMacrosInMath expands operator-like no-argument macros', () => {
  const expanded = expandNoArgMacrosInMath(String.raw`\Tr M = \Det A`, {
    Tr: String.raw`\operatorname{Tr}`,
    Det: String.raw`\operatorname{Det}`
  });
  assert.equal(expanded, String.raw`\operatorname{Tr} M = \operatorname{Det} A`);
});

test('tokenizeInlineMath only expands inside inline math delimiters', () => {
  const tokens = tokenizeInlineMath(String.raw`plain \Tr and $\Tr M$ and \(\Det A\)`, {
    Tr: String.raw`\operatorname{Tr}`,
    Det: String.raw`\operatorname{Det}`
  });
  assert.deepEqual(tokens, [
    { type: 'text', text: String.raw`plain \Tr and ` },
    { type: 'math', source: String.raw`$\operatorname{Tr} M$`, delimiter: '$' },
    { type: 'text', text: ' and ' },
    { type: 'math', source: String.raw`\(\operatorname{Det} A\)`, delimiter: String.raw`\(\)` }
  ]);
});

test('tokenizeInlineMath keeps plain double backslashes in prose tokens', () => {
  const tokens = tokenizeInlineMath(String.raw`line \\ break and $x+y$`, {});
  assert.deepEqual(tokens, [
    { type: 'text', text: String.raw`line \\ break and ` },
    { type: 'math', source: String.raw`$x+y$`, delimiter: '$' }
  ]);
});

test('splitParagraphHardBreaks splits TeX-style prose line breaks', () => {
  assert.deepEqual(splitParagraphHardBreaks(String.raw`line 1\\line 2\\line 3`), ['line 1', 'line 2', 'line 3']);
  assert.deepEqual(splitParagraphHardBreaks('plain line'), ['plain line']);
});

test('computeHeadingNumbers assigns LaTeX-like heading numbers and leaves paragraph unnumbered', () => {
  const numbers = computeHeadingNumbers([
    { type: 'heading', blockId: 'b1', level: 1 },
    { type: 'paragraph', blockId: 'b2' },
    { type: 'heading', blockId: 'b3', level: 2 },
    { type: 'heading', blockId: 'b4', level: 2 },
    { type: 'heading', blockId: 'b5', level: 1 },
    { type: 'heading', blockId: 'b6', level: 3 },
    { type: 'heading', blockId: 'b7', level: 4 }
  ]);
  assert.equal(numbers.get('b1'), '1');
  assert.equal(numbers.get('b3'), '1.1');
  assert.equal(numbers.get('b4'), '1.2');
  assert.equal(numbers.get('b5'), '2');
  assert.equal(numbers.get('b6'), '2.1.1');
  assert.equal(numbers.get('b7'), '');
});

test('normalizeTextCommands supports bare, braced, and spaced LaTeX/TeX prose commands', () => {
  assert.equal(normalizeTextCommands(String.raw`\LaTeX{}`), 'LaTeX');
  assert.equal(normalizeTextCommands(String.raw`\LaTeX`), 'LaTeX');
  assert.equal(normalizeTextCommands(String.raw`KakuTeX uses \LaTeX{} syntax and \TeX notes`), 'KakuTeX uses LaTeX syntax and TeX notes');
});

test('tokenizeInlineMath leaves prose text commands for the renderer token layer', () => {
  const tokens = tokenizeInlineMath(String.raw`A \LaTeX{} subset and \TeX notes`, {});
  assert.deepEqual(tokens, [
    { type: 'text', text: String.raw`A \LaTeX{} subset and \TeX notes` }
  ]);
});

test('tokenizeTextCommands turns LaTeX and TeX prose commands into MathJax-rendered logo tokens', () => {
  const tokens = tokenizeTextCommands(String.raw`A \LaTeX{} subset, \LaTeX\ and \TeX notes`);
  assert.deepEqual(tokens, [
    { type: 'text', text: 'A ' },
    { type: 'textCommand', name: 'LaTeX', text: 'LaTeX', source: String.raw`$\LaTeX$` },
    { type: 'text', text: ' subset, ' },
    { type: 'textCommand', name: 'LaTeX', text: 'LaTeX', source: String.raw`$\LaTeX$` },
    { type: 'text', text: ' and ' },
    { type: 'textCommand', name: 'TeX', text: 'TeX', source: String.raw`$\TeX$` },
    { type: 'text', text: ' notes' }
  ]);
});

test('tokenizeTextCommands converts prose LaTeX commands to MathJax inline sources', async () => {
  const mod = await import('../../app/src/preview-helpers.js');
  assert.deepEqual(mod.tokenizeTextCommands(String.raw`A \LaTeX{} subset and \TeX notes`), [
    { type: 'text', text: 'A ' },
    { type: 'textCommand', name: 'LaTeX', text: 'LaTeX', source: String.raw`$\LaTeX$` },
    { type: 'text', text: ' subset and ' },
    { type: 'textCommand', name: 'TeX', text: 'TeX', source: String.raw`$\TeX$` },
    { type: 'text', text: ' notes' }
  ]);
});
