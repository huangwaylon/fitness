// もようがえ's favourites on the record (`pref tentFavs`: contract/tent.ts): what the record takes, what the model
// keeps, its slot, the guest's own.
import { describe, expect, it } from 'vitest';
import { TENT_FAVS_MAX } from './tent.ts';
import { eventSlot, prefTaken, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';
import { reduce } from '../model/state.ts';
import type { EventRow } from './api.ts';

const now = Date.parse('2026-11-20T03:00:00.000Z');
const ev = (hm: string, who: 'A' | 'B' | 'G', data: object): EventRow => [new Date(`2026-11-20T${hm}:00+09:00`).toISOString(), who, `e${hm}${who}`, 'pref', JSON.stringify(data)];

describe('pref tentFavs', () => {
  it('the record takes null or up to 500 distinct codes; refuses the rest', () => {
    for (const v of [null, [], ['f4081'], ['f4081', 'w4840', 'g5018'], Array.from({ length: TENT_FAVS_MAX }, (_, i) => `f${i}`)])
      expect(validEventData('pref', { key: 'tentFavs', value: v }, now), JSON.stringify(v).slice(0, 40)).toBe(true);
    for (const v of ['f4081', ['x1'], ['f4081', 'f4081'], [4081], ['f1234567'], Array.from({ length: TENT_FAVS_MAX + 1 }, (_, i) => `f${i}`)])
      expect(validEventData('pref', { key: 'tentFavs', value: v }, now), JSON.stringify(v).slice(0, 40)).toBe(false);
    expect(prefTaken('tentFavs', ['f1'])).toBe(true);
    expect(prefTaken('tentFavs', 'f1')).toBe(false);
  });
  it("each person's own (the guest's too), the latest wins, null clears; one slot per person", () => {
    const p = reduce({
      metrics: [],
      events: [
        ev('10:00', 'A', { key: 'tentFavs', value: ['f1'] }),
        ev('10:01', 'G', { key: 'tentFavs', value: ['f2'] }),
        ev('10:02', 'A', { key: 'tentFavs', value: ['f3', 'f1'] }),
        ev('10:03', 'B', { key: 'tentFavs', value: ['f4'] }),
        ev('10:04', 'B', { key: 'tentFavs', value: null })
      ]
    }).prefs;
    expect([p.A.tentFavs, p.B.tentFavs, p.G.tentFavs]).toEqual([['f3', 'f1'], undefined, ['f2']]);
    expect(eventSlot('pref', 'G', 'G', { key: 'tentFavs', value: ['f1'] }, now)).toBe('pref|G|tentFavs');
    expect(guestMayWrite('pref', { key: 'tentFavs', value: ['f1'] })).toBe(true);
    expect(guestMayWrite('pref', { key: 'tentFavs', value: ['f1'], person: 'A' })).toBe(false);
  });
});
