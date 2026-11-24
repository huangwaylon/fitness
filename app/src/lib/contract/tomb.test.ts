import { describe, expect, it } from 'vitest';
import { expiresKind, isExpiringRemoval, lateOp, tombCut } from './tomb.ts';
import { newPostId } from './board.ts';

const NOW = Date.parse('2026-11-24T03:00:00.000Z');
const DAY = 86_400_000;

describe('removals expire', () => {
  it('every kind but an outdoor object and a seed item', () => {
    for (const t of ['board', 'food', 'food_repeat', 'food_recipe', 'food_custom', 'wtask', 'todo', 'hike', 'room_save']) expect(expiresKind(t, { id: 'x' })).toBe(true);
    expect(expiresKind('decor', { id: 'd1' })).toBe(true);
    expect(expiresKind('decor', { sc: 't', id: 'd1' })).toBe(true);
    expect(expiresKind('decor', { sc: 'o', id: 'oz' })).toBe(false);
    expect(expiresKind('pack', { id: '_abc123' })).toBe(true);
    expect(expiresKind('pack', { id: 'sunscreen' })).toBe(false);
    expect(expiresKind('spend', {})).toBe(false);
    expect(isExpiringRemoval('board', { id: 'b', at: 1, rm: true })).toBe(true);
    expect(isExpiringRemoval('board', { id: 'b', at: 1 })).toBe(false);
    expect(tombCut(NOW)).toBe(NOW - 60 * DAY);
  });

  it('an op is late when its at, or its id’s time, is past 59 days', () => {
    expect(lateOp('board', { id: newPostId(NOW), at: NOW }, NOW)).toBe(false);
    expect(lateOp('board', { id: newPostId(NOW - 58 * DAY), at: NOW }, NOW)).toBe(false);
    expect(lateOp('board', { id: newPostId(NOW - 60 * DAY), at: NOW }, NOW)).toBe(true);
    expect(lateOp('food', { id: 'fwhatever', at: NOW - 60 * DAY }, NOW)).toBe(true);
    // (a repeat's id may carry an older time: its at alone)
    expect(lateOp('food_repeat', { id: `r${(NOW - 90 * DAY).toString(36)}0000`, at: NOW }, NOW)).toBe(false);
    // (an id that isn't a time, or one in the future: its at alone)
    expect(lateOp('decor', { sc: 't', id: 'dtentwall', at: NOW }, NOW)).toBe(false);
    expect(lateOp('decor', { sc: 'o', id: 'oz', at: 1e12 }, NOW)).toBe(false);
  });
});
