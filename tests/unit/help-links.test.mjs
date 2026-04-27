import test from 'node:test';
import assert from 'node:assert/strict';
import { getManualTargets } from '../../app/src/help-links.js';

test('manual targets resolve disclaimer by locale', () => {
  const ja = getManualTargets('ja', 'disclaimer');
  assert.equal(ja.locale, 'ja');
  assert.equal(ja.htmlUrl, '../docs/user_manual/kakutex-user-manual-ja.html#disclaimer');

  const en = getManualTargets('en', 'disclaimer');
  assert.equal(en.locale, 'en');
  assert.equal(en.htmlUrl, '../docs/user_manual/kakutex-user-manual-en.html#disclaimer');
});

test('manual targets resolve basic operations anchor by locale', () => {
  assert.equal(
    getManualTargets('ja', 'basic-operations').htmlUrl,
    '../docs/user_manual/kakutex-user-manual-ja.html#basic-operations'
  );
  assert.equal(
    getManualTargets('en', 'basic-operations').htmlUrl,
    '../docs/user_manual/kakutex-user-manual-en.html#basic-operations'
  );
});
