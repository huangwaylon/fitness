// The leaf menu's retired order and hidden pills on the record (contract/menu.ts): what the record still takes (an older
// build's send), their slot, and that the model reads neither (one fixed grid since 2026-11-25).
import { describe, expect, it } from 'vitest';
import { menuHiddenOk, menuIdsOk, menuIdsRead } from './menu.ts';
import { eventSlot, prefTaken, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';
import { reduce } from '../model/state.ts';
import { eventSubject, type EventRow } from './api.ts';

const now = Date.parse('2026-11-19T03:00:00.000Z');
const ev = (hm: string, who: 'A' | 'B' | 'G', data: object): EventRow => [new Date(`2026-11-19T${hm}:00+09:00`).toISOString(), who, `e${hm}${who}`, 'pref', JSON.stringify(data)];

describe('pref menuOrder', () => {
  it('the record takes null or known ids, each once; refuses the rest', () => {
    for (const v of [null, ['english'], ['bells', 'travel'], ['bots', 'english', 'bells', 'hiking', 'wedding', 'travel']]) {
      expect(menuIdsOk(v), JSON.stringify(v)).toBe(true);
      expect(validEventData('pref', { key: 'menuOrder', value: v }, now), JSON.stringify(v)).toBe(true);
    }
    for (const v of [[], ['english', 'english'], ['shop'], ['settings'], ['bells', 'bells'], 'english', [1], { 0: 'travel' }, [...Array(7)].map(() => 'travel')])
      expect(validEventData('pref', { key: 'menuOrder', value: v }, now), JSON.stringify(v)).toBe(false);
  });

  it('a stored row naming a later id keeps its slot, a malformed one doesn’t', () => {
    expect(menuIdsRead(['shop', 'english'])).toBe(true);
    expect(prefTaken('menuOrder', ['shop', 'english'])).toBe(true);
    for (const v of ['english', [3], ['Eng lish'], [...Array(25)].map((_, i) => `x${i}`)]) expect(prefTaken('menuOrder', v), JSON.stringify(v)).toBe(false);
  });

  it('the model reads neither: an old row changes nothing (the grid is fixed)', () => {
    const p = reduce({ metrics: [], events: [ev('10:00', 'A', { key: 'menuOrder', value: ['english', 'travel'] }), ev('10:01', 'G', { key: 'menuHidden', value: ['hiking'] })] }).prefs;
    for (const who of ['A', 'G'] as const) expect(Object.keys(p[who] ?? {}).filter((k) => k.startsWith('menu')), who).toEqual([]);
  });

  it('one slot per person; the guest may write its own, no one with a `person`', () => {
    expect(eventSlot('pref', 'A', 'A', { key: 'menuOrder', value: ['english'] }, now)).toBe('pref|A|menuOrder');
    expect(eventSlot('pref', 'G', 'G', { key: 'menuOrder', value: null }, now)).toBe('pref|G|menuOrder');
    expect(guestMayWrite('pref', { key: 'menuOrder', value: ['english'] })).toBe(true);
    expect(eventSubject('pref', { key: 'menuOrder', value: ['english'], person: 'A' }, 'G') !== null).toBe(false);
  });
});

describe('pref menuHidden', () => {
  it('the record takes null or known ids, each once; 設定 and ベル never', () => {
    for (const v of [null, ['bots'], ['travel', 'wedding', 'hiking', 'english', 'bots']]) {
      expect(menuHiddenOk(v), JSON.stringify(v)).toBe(true);
      expect(validEventData('pref', { key: 'menuHidden', value: v }, now), JSON.stringify(v)).toBe(true);
    }
    for (const v of [[], ['settings'], ['bells'], ['english', 'bells'], ['english', 'english'], 'english', [1]])
      expect(validEventData('pref', { key: 'menuHidden', value: v }, now), JSON.stringify(v)).toBe(false);
    expect(prefTaken('menuHidden', ['shop', 'english'])).toBe(true);
    expect(prefTaken('menuHidden', 'english')).toBe(false);
  });

  it('its own slot; the guest’s own', () => {
    expect(eventSlot('pref', 'A', 'A', { key: 'menuHidden', value: ['english'] }, now)).toBe('pref|A|menuHidden');
    expect(guestMayWrite('pref', { key: 'menuHidden', value: ['english'] })).toBe(true);
    expect(eventSubject('pref', { key: 'menuHidden', value: ['english'], person: 'A' }, 'G') !== null).toBe(false);
  });
});
