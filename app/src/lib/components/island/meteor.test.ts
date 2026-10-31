import { describe, expect, it } from 'vitest';
import { SHOWER_GAP, nextStarMs, showerAt, showerNight } from './meteor.ts';
import { fragmentsOn, zodiacOf } from './beach.ts';
import { visitorAt } from './visitors.ts';
import { addDays, weekKeyOf } from '#lib/time/dates.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const days = (from: string, n: number): string[] => Array.from({ length: n }, (_, i) => addDays(from, i));
const nights = days('2026-01-05', 7 * 156); // three years of Monday-to-Sunday weeks
const showers = nights.filter((d) => showerNight(d));
const weekday = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();

describe('meteor showers', () => {
  it('about one night in ten, at most one a week (Monday to Sunday), on any night of the week', () => {
    expect(showers.length / nights.length).toBeGreaterThan(0.07);
    expect(showers.length / nights.length).toBeLessThan(0.13);
    const weeks = showers.map((d) => weekKeyOf(d));
    expect(new Set(weeks).size).toBe(weeks.length);
    expect(new Set(showers.map(weekday)).size).toBe(7);
  });
  it('seeded by the week: the same nights on both phones, others for another seed', () => {
    expect(nights.filter((d) => showerNight(d))).toEqual(showers);
    expect(nights.filter((d) => showerNight(d, 'other'))).not.toEqual(showers);
  });
  it('runs 20:00–04:00: the evening of its date and past midnight (edges: 19, 20, 3, 4)', () => {
    const d = showers[0], next = addDays(d, 1);
    expect(showerAt(d, addDays(d, -1), 19)).toBe(false);
    expect(showerAt(d, addDays(d, -1), 20)).toBe(true);
    expect(showerAt(d, addDays(d, -1), 23)).toBe(true);
    expect(showerAt(next, d, 0)).toBe(true);
    expect(showerAt(next, d, 3)).toBe(true);
    expect(showerAt(next, d, 4)).toBe(false);
    expect(showerAt(next, d, 12)).toBe(false);
    // the dev hook: any night, still only at night
    const plain = nights.find((x) => !showerNight(x) && !showerNight(addDays(x, -1)))!;
    expect(showerAt(plain, addDays(plain, -1), 21)).toBe(false);
    expect(showerAt(plain, addDays(plain, -1), 21, undefined, true)).toBe(true);
    expect(showerAt(plain, addDays(plain, -1), 12, undefined, true)).toBe(false);
  });
  it('shooting stars every 3–8 s on a shower night (a clear one has its showers: stars.test)', () => {
    expect(SHOWER_GAP).toEqual([3_000, 8_000]);
    expect(nextStarMs(() => 0)).toBe(3_000);
    expect(nextStarMs(() => 0.999)).toBeLessThan(8_000);
  });
});

describe('Celeste', () => {
  it('is the visitor on a shower night (20:00–04:00), before K.K. and Wisp; Jack keeps Halloween', () => {
    for (const d of showers.slice(0, 20)) {
      const wd = weekday(d);
      expect(visitorAt(d, addDays(d, -1), 21, wd)).toBe('celeste');
      expect(visitorAt(addDays(d, 1), d, 2, (wd + 1) % 7)).toBe('celeste');
      expect(visitorAt(d, addDays(d, -1), 19, wd)).not.toBe('celeste');
      expect(visitorAt(addDays(d, 1), d, 5, (wd + 1) % 7)).not.toBe('celeste');
    }
    const sat = showers.find((d) => weekday(d) === 6)!;
    expect(visitorAt(sat, addDays(sat, -1), 21, 6)).toBe('celeste');
    expect(visitorAt('2026-10-31', '2026-10-30', 21, 6, undefined, { id: 'halloween', night: true }, true)).toBe('jack');
  });
  it('a wish on a shower night is a fragment the next morning like any (one per wish: stars.ts), the zodiac one likelier', () => {
    let zPlain = 0, zShower = 0, nPlain = 0, nShower = 0;
    for (const d of days('2026-01-01', 365)) {
      const plain = fragmentsOn(d, 8), shower = fragmentsOn(d, 8, undefined, true);
      expect(plain).toHaveLength(8), expect(shower).toHaveLength(8);
      nPlain += plain.length, nShower += shower.length;
      zPlain += plain.filter((f) => f.id === zodiacOf(d)).length;
      zShower += shower.filter((f) => f.id === zodiacOf(d)).length;
    }
    expect(zShower / nShower).toBeGreaterThan(1.5 * (zPlain / nPlain));
  });
  it('her lines explain wishes and name the season’s sign, in both languages', () => {
    for (const cat of [ja, en] as Record<string, string>[]) {
      expect(cat['visitor.celeste']).toBeTruthy();
      expect(cat['chat.sp.celeste.intro'].split('\n').length).toBeGreaterThanOrEqual(3);
      for (const i of [0, 1, 2, 3]) expect(cat[`chat.sp.celeste.${i}`]).toBeTruthy();
      expect(cat['chat.sp.celeste.2']).toContain('{sign}');
      for (const z of ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpius', 'sagittarius', 'capricorn', 'aquarius', 'pisces'])
        expect(cat[`zodiac.${z}`]).toBeTruthy();
    }
    expect((ja as Record<string, string>)['visitor.celeste']).toBe('フーコ');
  });
});
