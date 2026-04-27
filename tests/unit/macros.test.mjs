import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMacros } from '../../app/src/macros.js';
import { BUILTIN_MACROS } from '../../app/src/config.js';

test('parseMacros reads no-argument macros', () => {
  const source = String.raw`\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}`;
  const parsed = parseMacros(source);
  assert.equal(parsed.macros.Tr, String.raw`\operatorname{Tr}`);
  assert.equal(parsed.macros.Det, String.raw`\operatorname{Det}`);
  assert.equal(parsed.diagnostics.length, 0);
});

test('parseMacros rejects argumented macros in v1', () => {
  const source = String.raw`\newcommand{\foo}[1]{#1}`;
  const parsed = parseMacros(source);
  assert.equal(Object.keys(parsed.macros).length, 0);
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagMacroArgs'));
});

test('parseMacros keeps built-in slashed reserved', () => {
  const source = String.raw`\newcommand{\slashed}{X}`;
  const parsed = parseMacros(source);
  assert.equal(Object.keys(parsed.macros).length, 0);
  assert.ok(parsed.diagnostics.some((diag) => diag.key === 'diagMacroReserved'));
});


test('built-in slashed macro keeps TeX backslashes intact', () => {
  assert.equal(BUILTIN_MACROS.slashed[0], String.raw`{\not\!#1}`);
  assert.equal(BUILTIN_MACROS.slashed[1], 1);
});
