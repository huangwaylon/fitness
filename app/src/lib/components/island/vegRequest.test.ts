// おねがい (vegRequest.ts): who asks, how often, for what, and the gift: the same on every phone.
import { describe, expect, it } from 'vitest';
import { CROPS } from '#lib/contract/farm.ts';
import { addDays } from '#lib/time/dates.ts';
import { GARDEN, GIFT_ONE_IN, askerOn, asks, requestOn, vegGift } from './vegRequest.ts';
import { GUESTS, ROLES, guestOn } from './visitorRoles.ts';
import { treeFurniture } from './catalog.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe('おねがい', () => {
  it('the chat and cheer guests ask, the others keep their role; Franklin on Turkey Day, nobody else then', () => {
    const askers = GUESTS.filter((g) => asks(g, '2026-11-12'));
    expect(askers.sort()).toEqual(['chip', 'gullivarrr', 'nat', 'phineas', 'rover', 'shrunk', 'tortimer']);
    for (const g of GUESTS) if (!askers.includes(g)) expect(['shop', 'gift', 'fortune', 'fish']).toContain(ROLES[g].kind);
    expect(asks('pave', '2026-11-12')).toBe(false);
    expect(asks('franklin', '2026-11-12')).toBe(false);
    expect(asks('franklin', '2026-11-26')).toBe(true);
    for (const g of GUESTS) expect(asks(g, '2026-11-26')).toBe(false);
    expect(askerOn('2026-11-26')).toBe('franklin');
    expect(requestOn('2026-11-26', 'A')).toMatchObject({ by: 'franklin', gift: true });
  });

  it('at most one a day per person, seeded by the day and the person: the same twice, about every other day, any of the six', () => {
    const year = days('2026-01-01', 364);
    const asked = year.filter((d) => requestOn(d, 'A'));
    // the guests' cycle: 7 of 14 ask (Turkey Day's Franklin instead of that day's guest)
    expect(asked.length / year.length).toBeGreaterThan(0.45);
    expect(asked.length / year.length).toBeLessThan(0.55);
    for (const d of asked) {
      expect(requestOn(d, 'A')).toEqual(requestOn(d, 'A'));
      expect(requestOn(d, 'B')?.by).toBe(requestOn(d, 'A')?.by);
      expect(requestOn(d, 'G')?.by).toBe(requestOn(d, 'A')!.by);
      if (d !== '2026-11-26') expect(requestOn(d, 'A')!.by).toBe(guestOn(d));
    }
    const crops = new Set(asked.map((d) => requestOn(d, 'A')!.crop));
    expect([...crops].sort()).toEqual([...CROPS].sort());
    // the two people's crops are their own draws (not always the same)
    expect(asked.some((d) => requestOn(d, 'A')!.crop !== requestOn(d, 'B')!.crop)).toBe(true);
    // a gift about one ask in GIFT_ONE_IN
    const gifts = asked.filter((d) => requestOn(d, 'A')!.gift).length / asked.length;
    expect(Math.abs(gifts - 1 / GIFT_ONE_IN)).toBeLessThan(0.1);
    // who stands there decides (a dev hook's guest): a shop guest asks nothing
    expect(requestOn('2026-11-12', 'A', undefined, 'gracie')).toBeNull();
    expect(requestOn('2026-11-12', 'A', undefined, 'rover')?.by).toBe('rover');
  });


  it('the gift: a garden piece the island hadn’t found (each one the tent places), then any piece, then none', () => {
    const pool = treeFurniture('2026-11-12').map((i) => i.id);
    for (const g of GARDEN) expect(pool, g).toContain(g);
    const g = vegGift('2026-11-12', 'A', pool, new Set());
    expect(GARDEN).toContain(g);
    expect(vegGift('2026-11-12', 'A', pool, new Set())).toBe(g);
    const rest = vegGift('2026-11-12', 'A', pool, new Set(GARDEN));
    expect(rest && !GARDEN.includes(rest)).toBe(true);
    expect(vegGift('2026-11-12', 'A', ['fence'], new Set(['fence']))).toBeNull();
  });
  it('its lines in both languages', () => {
    for (const k of ['visitor.veg.want', 'visitor.veg.ask', 'visitor.veg.none', 'visitor.veg.thanks', 'visitor.veg.gift', 'chat.sp.franklin.vegAsk',
      'chat.sp.franklin.vegThanks', 'farm.request', 'farm.requestDone']) {
      expect((ja as Record<string, string>)[k], k).toBeTruthy();
      expect((en as Record<string, string>)[k], k).toBeTruthy();
    }
  });
});
