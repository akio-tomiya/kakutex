import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAutosavePayload,
  collectAllDiagnostics,
  createInitialState,
  detectInitialLocale,
  snapshotSignature
} from '../../app/src/app-state.js';

test('detectInitialLocale prefers Japanese when navigator reports ja', () => {
  assert.equal(detectInitialLocale({ languages: ['ja-JP', 'en-US'], language: 'ja-JP' }), 'ja');
  assert.equal(detectInitialLocale({ languages: ['en-US'], language: 'en-US' }), 'en');
  assert.equal(detectInitialLocale(undefined), 'en');
});

test('createInitialState derives defaults and runtime status from protocol', () => {
  const httpState = createInitialState({ protocol: 'http:', locale: 'en' });
  const fileState = createInitialState({ protocol: 'file:', locale: 'ja' });
  assert.equal(httpState.locale, 'en');
  assert.equal(fileState.locale, 'ja');
  assert.equal(httpState.runtimeStatusKey, 'statusMathPending');
  assert.equal(fileState.runtimeStatusKey, 'statusFileProtocol');
  assert.equal(typeof httpState.body, 'string');
  assert.equal(typeof httpState.macros, 'string');
});

test('snapshotSignature and buildAutosavePayload keep persisted fields focused', () => {
  const state = createInitialState({ protocol: 'http:', locale: 'ja' });
  state.fileName = 'sample.texs';
  const signature = JSON.parse(snapshotSignature(state));
  assert.deepEqual(Object.keys(signature).sort(), ['body', 'fileName', 'locale', 'macros']);
  const payload = buildAutosavePayload(state, '0.0.1');
  assert.equal(payload.version, '0.0.1');
  assert.equal(payload.fileName, 'sample.texs');
});

test('collectAllDiagnostics merges and sorts parser and macro diagnostics', () => {
  const diagnostics = collectAllDiagnostics(
    { diagnostics: [{ key: 'b', lineStart: 4, lineEnd: 4 }] },
    { diagnostics: [{ key: 'a', lineStart: 2, lineEnd: 2 }] }
  );
  assert.deepEqual(diagnostics.map((diag) => diag.key), ['a', 'b']);
});
