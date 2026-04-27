import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTexsArchive, parseTexsArchive } from '../../app/src/texs-archive.js';

test('texs archive roundtrip succeeds', async () => {
  global.File = class File extends Blob {
    constructor(parts, name, options = {}) {
      super(parts, options);
      this.name = name;
    }
  };
  const blob = buildTexsArchive({
    body: 'body',
    macros: '\\newcommand{\\A}{A}',
    ui: { locale: 'ja' },
    meta: { fileName: 'sample.texs' }
  });
  const file = new File([await blob.arrayBuffer()], 'sample.texs', { type: 'application/zip' });
  const parsed = await parseTexsArchive(file);
  assert.equal(parsed.body, 'body');
  assert.equal(parsed.ui.locale, 'ja');
  assert.equal(parsed.meta.fileName, 'sample.texs');
});
