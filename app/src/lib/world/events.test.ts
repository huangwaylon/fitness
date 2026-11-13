import { describe, expect, it } from 'vitest';
import { eggTime, eventAt, turkeyDay } from './events.ts';
import { easter, nthWeekday } from '#lib/time/dates.ts';
import { EGG_ODDS, eggInBalloon, eggInDig, eggOnLine } from './eggs.ts';
import { HOSTS, visitorAt } from './visitors.ts';
import { addDays } from '#lib/time/dates.ts';
import { mulberry32 } from '#lib/random.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import jaNames from '#lib/i18n/catch.ja.json';

const weekday = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();

describe('NH events (events.ts)', () => {
  it('Halloween: all of Oct 31, its evening from 17:00 to midnight (Tokyo)', () => {
    expect(eventAt('2026-10-31', 0)).toEqual({ id: 'halloween', night: false });
    expect(eventAt('2026-10-31', 16)).toEqual({ id: 'halloween', night: false }); // 16:59
    expect(eventAt('2026-10-31', 17)).toEqual({ id: 'halloween', night: true }); // 17:00
    expect(eventAt('2026-10-31', 23)).toEqual({ id: 'halloween', night: true }); // 23:59
    expect(eventAt('2026-11-01', 0)).toBeNull(); // 00:00 Nov 1
    expect(eventAt('2026-10-30', 23)).toBeNull();
    expect(eventAt('2027-10-31', 20)).toEqual({ id: 'halloween', night: true }); // every year
  });
  it('a forced event (?event=) is on with its main part, any day; an unknown one is ignored', () => {
    expect(eventAt('2026-11-04', 9, 'halloween')).toEqual({ id: 'halloween', night: true });
    expect(eventAt('2026-11-04', 3, 'turkey-day')).toEqual({ id: 'turkey-day', night: true });
    expect(eventAt('2026-11-04', 9, 'bunny-week')).toEqual({ id: 'bunny-week', night: false });
    expect(eventAt('2026-10-31', 9, 'nope')).toEqual({ id: 'halloween', night: false });
  });
  it('the date helpers: the nth weekday of a month, Western Easter (known years)', () => {
    expect(nthWeekday(2026, 11, 4, 4)).toBe('2026-11-26');
    expect(nthWeekday(2026, 11, 0, 1)).toBe('2026-11-01'); // a month starting on its weekday
    expect(['2024-03-31', '2025-04-20', '2026-04-05', '2027-03-28', '2028-04-16', '2029-04-01', '2030-04-21', '2038-04-25', '2285-03-22'])
      .toEqual([2024, 2025, 2026, 2027, 2028, 2029, 2030, 2038, 2285].map(easter));
  });
  it('Turkey Day: the fourth Thursday of November (Nookipedia), Franklin 09:00–24:00', () => {
    expect([2026, 2027, 2028, 2029, 2030].map(turkeyDay)).toEqual(['2026-11-26', '2027-11-25', '2028-11-23', '2029-11-22', '2030-11-28']);
    for (const y of [2026, 2027, 2028, 2029, 2030]) expect(weekday(turkeyDay(y))).toBe(4);
    expect(eventAt('2026-11-26', 8)).toEqual({ id: 'turkey-day', night: false }); // 08:59
    expect(eventAt('2026-11-26', 9)).toEqual({ id: 'turkey-day', night: true });
    expect(eventAt('2026-11-19', 12)).toBeNull(); // the third Thursday
    expect(eventAt('2026-11-27', 0)).toBeNull();
  });
  it('Toy Day: Dec 24 (Jingle, all day in NH, from 05:00)', () => {
    expect(eventAt('2026-12-24', 4)).toEqual({ id: 'toy-day', night: false });
    expect(eventAt('2026-12-24', 5)).toEqual({ id: 'toy-day', night: true });
    expect(eventAt('2026-12-25', 1)).toBeNull();
    expect(eventAt('2026-12-23', 23)).toBeNull();
  });
  it('no Festivale: its host, Pavé, has no 3D model (not in NH’s files), and it had nothing else', () => {
    expect(eventAt('2027-02-08', 10)).toBeNull();
  });
  it('Bunny Day: Easter Sunday; its celebrations the 7 days before; Zipper on the first and last day (Nookipedia)', () => {
    // 2027: Easter 03-28; the week from Palm Sunday 03-21
    expect(eventAt('2027-03-20', 12)).toBeNull();
    expect(eventAt('2027-03-21', 12)).toEqual({ id: 'bunny-day', night: true });
    for (const d of ['2027-03-22', '2027-03-23', '2027-03-24', '2027-03-25', '2027-03-26', '2027-03-27'])
      expect(eventAt(d, 12)).toEqual({ id: 'bunny-week', night: false });
    expect(eventAt('2027-03-28', 12)).toEqual({ id: 'bunny-day', night: true });
    expect(eventAt('2027-03-29', 12)).toBeNull();
    expect(eggTime(eventAt('2027-03-24', 12))).toBe(true);
    expect(eggTime(eventAt('2027-03-28', 3))).toBe(true);
    expect(eggTime(eventAt('2027-03-29', 12))).toBe(false);
    expect(eventAt('2026-04-05', 12)).toEqual({ id: 'bunny-day', night: true }); // 2026's
  });
});

describe('holiday hosts in the visitor slot', () => {
  it('each event’s host from its main part, before anyone else; none on its eve or after midnight', () => {
    expect(HOSTS).toEqual({ halloween: 'jack', 'turkey-day': 'franklin', 'toy-day': 'jingle', 'bunny-day': 'zipper' });
    const at = (d: string, h: number) => visitorAt(d, addDays(d, -1), h, weekday(d));
    expect(at('2026-11-26', 8)).not.toBe('franklin');
    expect(at('2026-11-26', 9)).toBe('franklin');
    expect(at('2026-11-26', 23)).toBe('franklin');
    expect(at('2026-11-27', 1)).not.toBe('franklin');
    expect(at('2026-12-24', 12)).toBe('jingle');
    expect(at('2026-12-24', 22)).toBe('jingle');
    expect(at('2027-03-21', 8)).toBe('zipper'); // a Sunday morning: before Daisy Mae
    expect(at('2027-03-28', 12)).toBe('zipper');
    expect(at('2027-03-24', 12)).not.toBe('zipper'); // mid-week: eggs, no Zipper
  });
  it('their names and lines in both languages; Franklin asks for a fish and thanks with its name', () => {
    for (const cat of [ja, en] as Record<string, string>[]) {
      for (const id of ['franklin', 'jingle', 'zipper']) {
        expect(cat[`visitor.${id}`]).toBeTruthy();
        expect(cat[`chat.sp.${id}.intro`].split('\n').length).toBeGreaterThanOrEqual(3);
        for (const i of [0, 1, 2, 3]) expect(cat[`chat.sp.${id}.${i}`]).toBeTruthy();
      }
      expect(cat['chat.sp.franklin.ask']).toBeTruthy();
      expect(cat['chat.sp.franklin.thanks']).toContain('{fish}');
      expect(cat['beach.fished']).toContain('{name}');
    }
    expect([(ja as Record<string, string>)['visitor.franklin'], (ja as Record<string, string>)['visitor.zipper']])
      .toEqual(['フランクリン', 'ぴょんたろう']);
    expect((jaNames as Record<string, string>)['beach.name.water-egg']).toBe('サカナのたまご');
  });
});

describe('Bunny Day eggs (eggs.ts)', () => {
  it('a balloon 1 in 3, a fish on the line 1 in 6, a dig spot 1 in 4 (its own stream, so both phones agree)', () => {
    const r = mulberry32(7);
    const n = 6000;
    const balloon = Array.from({ length: n }, () => eggInBalloon(r)).filter(Boolean).length / n;
    const line = Array.from({ length: n }, () => eggOnLine(r)).filter(Boolean).length / n;
    expect(Math.abs(balloon - EGG_ODDS.balloon)).toBeLessThan(0.03);
    expect(Math.abs(line - EGG_ODDS.line)).toBeLessThan(0.03);
    const days = Array.from({ length: 200 }, (_, i) => addDays('2027-01-01', i));
    const dig = days.flatMap((d) => ['f0', 'f1', 'f2'].map((u) => eggInDig(d, u))).filter(Boolean).length / (days.length * 3);
    expect(Math.abs(dig - EGG_ODDS.dig)).toBeLessThan(0.05);
    expect(eggInDig('2027-03-24', 'f0')).toBe(eggInDig('2027-03-24', 'f0'));
  });
});
