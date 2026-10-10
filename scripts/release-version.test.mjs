import assert from 'node:assert/strict';
import test from 'node:test';
import { nextVersion } from './release-version.mjs';

test('chooses patch, minor, and major from Conventional Commits', () => {
  assert.equal(nextVersion('0.3.7', ['fix(editor): save images']), '0.3.8');
  assert.equal(nextVersion('0.3.7', ['fix: typo', 'feat(sheets): add filters']), '0.4.0');
  assert.equal(nextVersion('0.3.7', ['feat(api)!: change format']), '1.0.0');
  assert.equal(nextVersion('0.3.7', ['fix: update format\n\nBREAKING CHANGE: files changed']), '1.0.0');
  assert.equal(nextVersion('0.3.7', []), null);
});
