import assert from 'node:assert/strict';
import test from 'node:test';
import { pageIndexAtOffset, shouldAnimateTabTap } from '../src/features/navigation/pager';

test('pager selection follows the closest page as a swipe crosses its midpoint', () => {
  assert.equal(pageIndexAtOffset(499, 1000, 5), 0);
  assert.equal(pageIndexAtOffset(501, 1000, 5), 1);
  assert.equal(pageIndexAtOffset(2499, 1000, 5), 2);
  assert.equal(pageIndexAtOffset(2501, 1000, 5), 3);
});

test('pager selection clamps fast swipes at the first and last page', () => {
  assert.equal(pageIndexAtOffset(-5000, 1000, 5), 0);
  assert.equal(pageIndexAtOffset(9000, 1000, 5), 4);
});

test('pager selection safely handles an invalid viewport width', () => {
  assert.equal(pageIndexAtOffset(400, 0, 5), 0);
  assert.equal(pageIndexAtOffset(Number.NaN, 100, 5), 0);
});

test('tab taps animate only to the same or adjacent page', () => {
  assert.equal(shouldAnimateTabTap(1, 2), true);
  assert.equal(shouldAnimateTabTap(2, 1), true);
  assert.equal(shouldAnimateTabTap(0, 4), false);
  assert.equal(shouldAnimateTabTap(4, 0), false);
});
