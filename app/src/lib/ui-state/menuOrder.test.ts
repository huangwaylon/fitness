// The leaf menu's order merge (ui-state/menuOrder.ts): defaults, a new pill, a removed one.
import { describe, expect, it } from 'vitest';
import { menuDefaults, mergeMenuOrder, moved } from './menuOrder.ts';

const ALL = menuDefaults(true);

describe('mergeMenuOrder', () => {
  it('nothing saved: the default order (ボット only with a bot)', () => {
    expect(mergeMenuOrder(ALL, undefined)).toEqual(['travel', 'wedding', 'hiking', 'english', 'bots']);
    expect(mergeMenuOrder(menuDefaults(false), null)).toEqual(['travel', 'wedding', 'hiking', 'english']);
  });

  it('a saved order is kept', () => {
    expect(mergeMenuOrder(ALL, ['bots', 'english', 'hiking', 'wedding', 'travel'])).toEqual(['bots', 'english', 'hiking', 'wedding', 'travel']);
  });

  it('a pill newer than the saved order slots in after its default predecessor, or first', () => {
    expect(mergeMenuOrder(ALL, ['english', 'travel', 'wedding', 'bots'])).toEqual(['english', 'travel', 'wedding', 'hiking', 'bots']);
    expect(mergeMenuOrder(ALL, ['english', 'wedding', 'hiking', 'bots'])).toEqual(['travel', 'english', 'wedding', 'hiking', 'bots']);
    expect(mergeMenuOrder(ALL, ['bots', 'travel', 'wedding', 'hiking'])).toEqual(['bots', 'travel', 'wedding', 'hiking', 'english']);
    // two new neighbours keep their default order
    expect(mergeMenuOrder(ALL, ['english', 'travel', 'bots'])).toEqual(['english', 'travel', 'wedding', 'hiking', 'bots']);
  });

  it('an unknown, retired or hidden id is dropped, a repeat kept once', () => {
    expect(mergeMenuOrder(ALL, ['sugoroku', 'english', 'english', 'shop', 'travel', 'wedding', 'hiking', 'bots'])).toEqual(['english', 'travel', 'wedding', 'hiking', 'bots']);
    // the guest's phone has no ボット: a saved one is skipped, and comes back where it was if it shows again
    const saved = ['bots', 'english', 'travel', 'wedding', 'hiking'];
    expect(mergeMenuOrder(menuDefaults(false), saved)).toEqual(['english', 'travel', 'wedding', 'hiking']);
    expect(mergeMenuOrder(ALL, saved)).toEqual(saved);
  });
});

describe('moved', () => {
  it('moves one item, clamped to the list', () => {
    expect(moved(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moved(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moved(['a', 'b', 'c'], 1, 9)).toEqual(['a', 'c', 'b']);
    expect(moved(['a', 'b', 'c'], 1, -3)).toEqual(['b', 'a', 'c']);
  });
});
