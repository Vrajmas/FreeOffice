import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBranch, validateSubject } from './validate-naming.mjs';

test('accepts conventional names', () => {
  assert.equal(validateBranch('feat/android-build'), true);
  assert.equal(validateBranch('ci/release-artifacts'), true);
  assert.equal(validateSubject('fix(editor): preserve document title'), true);
  assert.equal(validateSubject('feat!: change file format'), true);
});

test('rejects missing type, scope, or description', () => {
  assert.equal(validateBranch('new-feature'), false);
  assert.equal(validateBranch('codex/feature'), false);
  assert.equal(validateSubject('Add APK builds'), false);
  assert.equal(validateSubject('fix: '), false);
});
