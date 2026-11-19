// The leaf menu's order on the record (contract/menu.ts): what the record takes, what the model keeps, its slot.
import { describe, expect, it } from 'vitest';
import { menuOrderOk, menuOrderRead } from './menu.ts';
import { eventSlot, prefTaken, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';
import { reduce } from '../model/state.ts';
import type { EventRow } from './api.ts';

const now = Date.parse('2026-11-19T03:00:00.000Z');
const ev = (hm: string, who: 'A' | 'B' | 'G', data: object): EventRow => [new Date(`2026-11-19T${hm}:00+09:00`).toISOString(), who, `e${hm}${who}`, 'pref', JSON.stringify(data)];
const orders = (events: EventRow[]) => ((p) => [p.A.menuOrder, p.B.menuOrder, p.G.menuOrder])(reduce({ metrics: [], events }).prefs);

describe('pref menuOrder', () => {
  it('the record takes null or known ids, each once; refuses the rest', () => {
    for (const v of [null, ['english'], ['bots', 'english', 'hiking', 'wedding', 'travel']]) {
      expect(menuOrderOk(v), JSON.stringify(v)).toBe(true);
      expect(validEventData('pref', { key: 'menuOrder', value: v }, now), JSON.stringify(v)).toBe(true);
    }
    for (const v of [[], ['english', 'english'], ['shop'], ['settings'], ['bells'], 'english', [1], { 0: 'travel' }, [...Array(6)].map(() => 'travel')])
      expect(validEventData('pref', { key: 'menuOrder', value: v }, now), JSON.stringify(v)).toBe(false);
  });

  it('a phone reads a later build’s id too (it drops it when merging), never a malformed list', () => {
    expect(menuOrderRead(['shop', 'english'])).toBe(true);
    expect(prefTaken('menuOrder', ['shop', 'english'])).toBe(true);
    for (const v of ['english', [3], ['Eng lish'], [...Array(25)].map((_, i) => `x${i}`)]) expect(prefTaken('menuOrder', v), JSON.stringify(v)).toBe(false);
  });

  it('the model: each person’s own, the last one wins, null back to the default, a malformed one changes nothing', () => {
    expect(orders([
      ev('10:00', 'A', { key: 'menuOrder', value: ['english', 'travel'] }),
      ev('10:01', 'G', { key: 'menuOrder', value: ['hiking'] }),
      ev('10:02', 'A', { key: 'menuOrder', value: ['bots'] }),
      ev('10:03', 'B', { key: 'menuOrder', value: ['wedding'] }),
      ev('10:04', 'B', { key: 'menuOrder', value: 'travel' })
    ])).toEqual([['bots'], ['wedding'], ['hiking']]);
    expect(orders([ev('10:00', 'A', { key: 'menuOrder', value: ['english'] }), ev('10:01', 'A', { key: 'menuOrder', value: null })])).toEqual([undefined, undefined, undefined]);
  });

  it('one slot per person; the guest may write its own, never with a `person`', () => {
    expect(eventSlot('pref', 'A', 'A', { key: 'menuOrder', value: ['english'] }, now)).toBe('pref|A|menuOrder');
    expect(eventSlot('pref', 'G', 'G', { key: 'menuOrder', value: null }, now)).toBe('pref|G|menuOrder');
    expect(guestMayWrite('pref', { key: 'menuOrder', value: ['english'] })).toBe(true);
    expect(guestMayWrite('pref', { key: 'menuOrder', value: ['english'], person: 'A' })).toBe(false);
  });
});
