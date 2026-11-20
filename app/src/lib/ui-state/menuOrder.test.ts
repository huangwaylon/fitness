// The leaf menu's order merge and hidden pills (ui-state/menuOrder.ts): defaults, a new pill, a removed one.
import { describe, expect, it } from 'vitest';
import { menuDefaults, mergeMenuOrder, moved, shownHidden } from './menuOrder.ts';

const ALL = menuDefaults(true);

describe('mergeMenuOrder', () => {
  it('nothing saved: the default order (ボット only with a bot)', () => {
    expect(mergeMenuOrder(ALL, undefined)).toEqual(['bells', 'travel', 'wedding', 'hiking', 'english', 'bots', 'todo']);
    expect(mergeMenuOrder(menuDefaults(false), null)).toEqual(['bells', 'travel', 'wedding', 'hiking', 'english', 'todo']);
  });

  it('a saved order is kept, ベル where it was moved to', () => {
    expect(mergeMenuOrder(ALL, ['bots', 'english', 'bells', 'hiking', 'wedding', 'travel', 'todo'])).toEqual(['bots', 'english', 'bells', 'hiking', 'wedding', 'travel', 'todo']);
    expect(mergeMenuOrder(ALL, ['travel', 'wedding', 'hiking', 'english', 'bots', 'bells', 'todo'])).toEqual(['travel', 'wedding', 'hiking', 'english', 'bots', 'bells', 'todo']);
    // the guest's phone (no ボット): ベル keeps its place among the rest
    expect(mergeMenuOrder(menuDefaults(false), ['english', 'bots', 'bells', 'travel', 'todo'])).toEqual(['english', 'bells', 'travel', 'wedding', 'hiking', 'todo']);
  });

  it('an order from before ベル moved (no bells): ベル first, the rest unchanged', () => {
    expect(mergeMenuOrder(ALL, ['bots', 'english', 'hiking', 'wedding', 'travel', 'todo'])).toEqual(['bells', 'bots', 'english', 'hiking', 'wedding', 'travel', 'todo']);
    expect(mergeMenuOrder(menuDefaults(false), ['hiking', 'travel'])).toEqual(['bells', 'hiking', 'english', 'todo', 'travel', 'wedding']);
  });

  it('a pill newer than the saved order slots in after its default predecessor, or first', () => {
    expect(mergeMenuOrder(ALL, ['bells', 'english', 'travel', 'wedding', 'bots'])).toEqual(['bells', 'english', 'travel', 'wedding', 'hiking', 'bots', 'todo']);
    expect(mergeMenuOrder(ALL, ['english', 'bells', 'wedding', 'hiking', 'bots'])).toEqual(['english', 'bells', 'travel', 'wedding', 'hiking', 'bots', 'todo']);
    expect(mergeMenuOrder(ALL, ['bots', 'bells', 'travel', 'wedding', 'hiking'])).toEqual(['bots', 'todo', 'bells', 'travel', 'wedding', 'hiking', 'english']);
    // two new neighbours keep their default order
    expect(mergeMenuOrder(ALL, ['bells', 'english', 'travel', 'bots'])).toEqual(['bells', 'english', 'travel', 'wedding', 'hiking', 'bots', 'todo']);
  });

  it('an unknown, retired or hidden id is dropped, a repeat kept once', () => {
    expect(mergeMenuOrder(ALL, ['sugoroku', 'bells', 'english', 'english', 'shop', 'travel', 'bells', 'wedding', 'hiking', 'bots'])).toEqual(['bells', 'english', 'travel', 'wedding', 'hiking', 'bots', 'todo']);
    // the guest's phone has no ボット: a saved one is skipped, and comes back where it was if it shows again
    const saved = ['bots', 'bells', 'english', 'travel', 'wedding', 'hiking', 'todo'];
    expect(mergeMenuOrder(menuDefaults(false), saved)).toEqual(['bells', 'english', 'travel', 'wedding', 'hiking', 'todo']);
    expect(mergeMenuOrder(ALL, saved)).toEqual(saved);
  });
});

describe('shownHidden', () => {
  it('none saved: every pill shows; a saved one hides only what this phone has', () => {
    expect([...shownHidden(ALL, null)]).toEqual([]);
    expect([...shownHidden(ALL, undefined)]).toEqual([]);
    expect([...shownHidden(ALL, ['english', 'bots'])]).toEqual(['english', 'bots']);
    // no ボット on the guest's phone; a later build's id and 設定 (not an id) hide nothing
    expect([...shownHidden(menuDefaults(false), ['bots', 'sugoroku', 'settings', 'hiking'])]).toEqual(['hiking']);
  });

  it('ベル is never hidden, even if a list names it (the record refuses it: contract/menu.ts)', () => {
    expect([...shownHidden(ALL, ['bells'])]).toEqual([]);
    expect([...shownHidden(ALL, ['english', 'bells'])]).toEqual(['english']);
  });

  it('hidden pills keep their place in the order (shown again where they were); a new pill shows', () => {
    const order = mergeMenuOrder(ALL, ['english', 'travel', 'wedding', 'bots']);
    const hidden = shownHidden(ALL, ['travel']);
    expect(order.filter((id) => !hidden.has(id))).toEqual(['bells', 'english', 'wedding', 'hiking', 'bots', 'todo']);
    expect(order).toEqual(['bells', 'english', 'travel', 'wedding', 'hiking', 'bots', 'todo']);
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
