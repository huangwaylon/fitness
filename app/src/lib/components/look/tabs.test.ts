import { describe, expect, it } from 'vitest';
import { KIND_OF, SUBS, TABS, dotNames, firstTab, statusOf } from './tabs.ts';
import { closet } from './closet.ts';

describe('すがた tabs', () => {
  it('six tabs; every closet grid is reachable from one sub (or かみ)', () => {
    expect(TABS).toEqual(['coord', 'face', 'hair', 'wear', 'acc', 'villager']);
    const kinds = new Set([...Object.values(SUBS).flat().map((s) => KIND_OF[s]), KIND_OF.hair].filter(Boolean));
    expect([...kinds].sort()).toEqual(['bottom', 'eye', 'glasses', 'hair', 'hat', 'mouth', 'onepiece', 'ornament', 'shoes', 'socks', 'top']);
    for (const k of kinds) expect(closet().items(k!).length).toBeGreaterThan(0);
  });

  it('opens on コーデ when any is saved, else ふく', () => {
    expect(firstTab(0)).toBe('wear');
    expect(firstTab(2)).toBe('coord');
  });

  it('the pill: exact first, then started-from, else コーデなし; a villager is its own (the guest’s いつもの)', () => {
    expect(statusOf({ villager: false, guest: false, exact: 'usual', from: 'ふゆ' })).toEqual({ kind: 'usual' });
    expect(statusOf({ villager: false, guest: false, exact: 'ふゆ', from: 'usual' })).toEqual({ kind: 'saved', name: 'ふゆ' });
    expect(statusOf({ villager: false, guest: false, exact: null, from: 'ふゆ' })).toEqual({ kind: 'edited', from: 'ふゆ' });
    expect(statusOf({ villager: false, guest: false, exact: null, from: null })).toEqual({ kind: 'none' });
    expect(statusOf({ villager: true, guest: false, exact: null, from: null })).toEqual({ kind: 'villager', usual: false });
    expect(statusOf({ villager: true, guest: true, exact: 'usual', from: 'usual' })).toEqual({ kind: 'villager', usual: true });
  });

  it('a dot is named by its hue, numbered only when two share one', () => {
    expect(dotNames(['#e04848', '#4f7fd0'])).toEqual([{ hue: 'red', n: null }, { hue: 'blue', n: null }]);
    expect(dotNames(['#2f241d', '#4f7fd0', '#2a1b12'])).toEqual([{ hue: 'brown', n: 1 }, { hue: 'blue', n: null }, { hue: 'brown', n: 2 }]);
  });
});
