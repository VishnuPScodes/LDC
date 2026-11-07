import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAdvancePdfBookmark } from './pdf-bookmark.js';

test('a fresh learner starts the bookmark at the first answered question', () => {
  assert.equal(shouldAdvancePdfBookmark(undefined, 12), true);
  assert.equal(shouldAdvancePdfBookmark(0, 12), true);
});

test('the bookmark only moves forward', () => {
  assert.equal(shouldAdvancePdfBookmark(40, 41), true);
  assert.equal(shouldAdvancePdfBookmark(40, 40), false);
  assert.equal(shouldAdvancePdfBookmark(40, 3), false);
});

test('questions without a paper position never move the bookmark', () => {
  assert.equal(shouldAdvancePdfBookmark(40, undefined), false);
  assert.equal(shouldAdvancePdfBookmark(undefined, 0), false);
});
