// Tokyo's real sky on the island (docs/design.md "Weather"): the relay's timeline (live-protocol.ts Wx) read by the
// hour: its letters as the game's skies, winter rain falling as snow, the event nights held fine, the seeded treats on
// real clear hours, the fallbacks (no timeline, one that no longer covers the hour, one 36 hours old) and the 05:00
// day; the `?wx=` fixtures; the island-wide mode (`pref weatherMode`); the phone's cache of the timeline.
import { beforeEach, describe, expect, it } from 'vitest';
import { parseServer, type Wx } from '#lib/contract/live-protocol.ts';
import { configureStorage, LIVE, type KV } from '#lib/sync/storage.ts';
import { heldWx, onWx, resetWx, takeWx } from '#lib/sync/wx.ts';
import { reduce } from '#lib/model/state.ts';
import { eventSlot, prefTaken } from '#lib/contract/record.ts';
import { guestMayWrite } from '#lib/contract/guest.ts';
import type { EventRow } from '#lib/contract/api.ts';
import { addDays } from '#lib/time/dates.ts';
import { dayWeather, heldFine, weatherAt, isRain, musicWeather, realWeatherAt, snowSeason, WX_TTL_MS, yieldSkyAt, type Sky } from '#lib/world/weather.ts';
import { BUGS, FISH, oddsAt, type Seasonal } from '#lib/world/critters.ts';
import { showerNight } from '#lib/world/meteor.ts';
import { WX_FIXTURES, wxFixture } from '#lib/world/wxFixtures.ts';

const H = 3600_000;
/** Tokyo `date` at `hm` (ms). */
const tokyo = (date: string, hm = '12:00') => Date.parse(`${date}T${hm}:00+09:00`);
/** A timeline of `s` from 12 hours before `now`'s hour (as the relay's), fetched at `now`. */
const tl = (now: number, s: string, extra: Partial<Wx> = {}): Wx => ({ h0: Math.floor(now / H) - 12, s, at: now, src: 'om', rev: 1, ...extra });
/** All 48 hours one letter. */
const all = (now: number, c: string, extra: Partial<Wx> = {}) => tl(now, c.repeat(48), extra);
const sky = (wx: Wx | null, now: number) => realWeatherAt(wx, now)?.sky ?? null;

describe('the real sky', () => {
  it("reads the hour's letter: clear, cloudy, rain, heavy, snow; fog the hour's extra", () => {
    const now = tokyo('2026-06-10', '11:20');
    const got = ['c', 'o', 'r', 'h', 's'].map((c) => sky(all(now, c), now));
    expect(got).toEqual(['clear', 'cloudy', 'rain', 'heavy', 'snow']);
    // the hour itself: index 12 (the timeline starts 12 hours back)
    const s = 'c'.repeat(12) + 'r' + 'c'.repeat(35);
    expect([sky(tl(now, s), now), sky(tl(now, s), now + H), sky(tl(now, s), now - H)]).toEqual(['rain', 'clear', 'clear']);
    expect(realWeatherAt(all(now, 'o', { fx: [12] }), now)).toEqual({ sky: 'cloudy', fog: true, rainbow: 0, aurora: false });
  });

  it('falls back to the seeded day: no timeline, past its hours, before them, fetched over 36 hours ago', () => {
    const now = tokyo('2026-06-10', '11:20');
    const wx = all(now, 'r');
    const got = [
      sky(null, now),
      sky(wx, now + 36 * H), // its last hour is now + 35
      sky(wx, now - 13 * H),
      sky({ ...wx, at: now - WX_TTL_MS - 1 }, now),
      sky({ ...wx, at: now - WX_TTL_MS }, now),
      sky(wx, now + 35 * H)
    ];
    expect(got).toEqual([null, null, null, null, 'rain', 'rain']);
  });

  it('winter (December 11 – February 24): real rain falls as snow; either side of it rain stays rain', () => {
    const at = (d: string) => sky(all(tokyo(d), 'r'), tokyo(d));
    const heavy = (d: string) => sky(all(tokyo(d), 'h'), tokyo(d));
    expect(['2026-12-10', '2026-12-11', '2027-01-15', '2027-02-24', '2027-02-25'].map(at)).toEqual(['rain', 'snow', 'snow', 'snow', 'rain']);
    expect([heavy('2027-01-15'), heavy('2027-03-01')]).toEqual(['snow', 'heavy']);
    expect([snowSeason('2026-12-11'), snowSeason('2027-02-24'), snowSeason('2027-02-25'), snowSeason('2026-12-10')]).toEqual([true, true, false, false]);
  });

  it('the event nights stay fine: the August Sundays, New Year, a meteor shower, the wedding; their days are real', () => {
    const shower = Array.from({ length: 60 }, (_, i) => addDays('2026-06-01', i)).find((d) => showerNight(d))!;
    const cases: [string, string, string][] = [
      ['2026-08-09', '20:00', 'clear'], // an August Sunday's show (19:00–24:00)
      ['2026-08-09', '18:00', 'rain'],
      ['2026-08-10', '20:00', 'rain'], // a Monday
      ['2026-12-31', '23:30', 'snow'], // New Year's countdown: fine (the snowy season: snow otherwise)
      ['2027-01-01', '00:30', 'clear'],
      ['2027-01-01', '01:30', 'snow'],
      [shower, '21:00', 'clear'], // a shower's night (20:00–04:00)
      [addDays(shower, 1), '03:00', 'clear'],
      [shower, '19:00', 'rain'],
      ['2027-10-08', '20:00', 'clear'], // the wedding night
      ['2027-10-08', '12:00', 'rain']
    ];
    const got = cases.map(([d, hm]) => {
      const now = tokyo(d, hm);
      return sky(all(now, 'r'), now);
    });
    // New Year's 23:30: held fine
    expect(got).toEqual(cases.map(([d, hm, s]) => (d === '2026-12-31' && hm === '23:30' ? 'clear' : s)));
    expect([heldFine('2026-08-09', 23), heldFine('2026-08-09', 12), heldFine('2027-10-08', 19)]).toEqual([true, false, true]);
  });

  it("the seeded treats on real clear hours: the 07:00 fog and the aurora (its evening's day after midnight)", () => {
    const days = Array.from({ length: 365 * 3 }, (_, i) => addDays('2026-01-01', i));
    const fogDay = days.find((d) => dayWeather(d).fog)!;
    const auroraDay = days.find((d) => dayWeather(d).aurora)!;
    const at = (d: string, hm: string, c: string) => {
      const now = tokyo(d, hm);
      return realWeatherAt(all(now, c), now)!;
    };
    expect([at(fogDay, '07:10', 'c').fog, at(fogDay, '08:10', 'c').fog, at(fogDay, '07:10', 'r').fog]).toEqual([true, false, false]);
    expect([at(auroraDay, '21:00', 'c').aurora, at(addDays(auroraDay, 1), '03:00', 'c').aurora, at(auroraDay, '21:00', 'o').aurora, at(auroraDay, '12:00', 'c').aurora]).toEqual([true, true, false, false]);
    // a snowy night has none
    expect(at(auroraDay, '21:00', 's').aurora).toBe(false);
  });

  it('cloudy is a fine day for the game: the sunny music, no rain-only critters, the dry ones out', () => {
    const odds = (c: Seasonal, s: Sky) => oddsAt(c, c.months[0], c.hours[0], s);
    const snail = Object.values(BUGS).find((b) => b.weather === 'rain')!, butterfly = Object.values(BUGS).find((b) => b.weather === 'dry')!;
    const got = [musicWeather('cloudy'), isRain('cloudy'), odds(snail, 'cloudy'), odds(snail, 'rain') > 0, odds(butterfly, 'cloudy') > 0, odds(FISH.coelacanth, 'cloudy'), odds(FISH.coelacanth, 'snow') > 0];
    expect(got).toEqual(['sunny', false, 0, true, true, 0, true]);
  });

  it('the rainbow: the first fine hour 07:00–17:00 right after rain, once a day, now and then double; none after snow', () => {
    /** A day's timeline from its 00:00 (`spec` a letter an hour, then fine), read at `hm`. */
    const bow = (spec: string, hm: string, d = '2026-06-10') => {
      const now = tokyo(d, hm);
      return realWeatherAt({ h0: Math.floor(tokyo(d, '00:00') / H), s: spec.padEnd(48, 'c'), at: now, src: 'om', rev: 1 }, now)!.rainbow;
    };
    const morning = 'ccccc' + 'rrrrr'; // rain 05:00–10:00, fine from 10:00
    const got = [
      bow(morning, '10:20') > 0,
      bow(morning, '11:20'), // the next hour: gone
      bow('ccccc' + 'hhhhh', '10:20') > 0, // after a downpour too
      bow('ccccc' + 'ooooo', '10:20'), // no rain
      bow('ccccc' + 'rrrrr' + 'o', '10:20'), // clouds after the rain: none
      bow('ccccc' + 'rrr' + 'c' + 'r', '08:20') > 0, // a second shower that day…
      bow('ccccc' + 'rrr' + 'c' + 'r', '10:20'), // …brings no second rainbow
      bow('cc' + 'rr', '04:20'), // before 07:00
      bow('cc' + 'rr', '07:20'), // 07:00 isn't right after it
      bow('c'.repeat(7) + 'r'.repeat(10), '17:20'), // from 17:00
      bow(morning, '10:20', '2027-01-20') // the snowy season: it snowed
    ];
    expect(got).toEqual([true, 0, true, 0, 0, true, 0, 0, 0, 0, 0]);
    // double about 1 in 8, by the date (both phones)
    const days = Array.from({ length: 600 }, (_, i) => addDays('2026-03-01', i)).filter((d) => !snowSeason(d));
    const bows = days.map((d) => bow(morning, '10:20', d));
    const two = bows.filter((x) => x === 2).length / bows.length;
    expect([bows.every((x) => x === 1 || x === 2), two > 0.06 && two < 0.2]).toEqual([true, true]);
  });

  it('has no day boundary: the hour after midnight reads the next letter, the same on every phone', () => {
    // a night no event holds fine
    const d = Array.from({ length: 30 }, (_, i) => addDays('2026-06-01', i)).find((x) => !heldFine(x, 23) && !heldFine(addDays(x, 1), 0))!;
    const now = tokyo(d, '23:40');
    const s = 'c'.repeat(12) + 'cr' + 'c'.repeat(34);
    const wx = tl(now, s);
    expect([sky(wx, now), sky(wx, now + 20 * 60_000), sky(structuredClone(wx), now + 20 * 60_000)]).toEqual(['clear', 'rain', 'rain']);
  });

  it('the ?wx= fixtures lie on the scene clock: rain in the afternoon, a downpour, snow, foggy mornings, a stale one', () => {
    const at = (name: (typeof WX_FIXTURES)[number], hm: string) => {
      const now = tokyo('2026-06-10', hm);
      return realWeatherAt(wxFixture(name, now), now);
    };
    expect([at('rain-pm', '13:00')?.sky, at('rain-pm', '10:00')?.sky, at('typhoon', '10:00')?.sky, at('snow', '10:00')?.sky, at('clears', '10:00')?.sky, at('clears', '15:00')?.sky]).toEqual(['rain', 'clear', 'heavy', 'snow', 'rain', 'clear']);
    expect([at('fog', '06:00')?.fog, at('fog', '10:00')?.fog, at('cloudy', '10:00')?.sky, at('stale', '10:00')]).toEqual([true, false, 'cloudy', null]);
    // the rain clearing at 14:00 brings its rainbow; on a winter day the rain falls as snow; an August Sunday's
    // fireworks night is fine through a typhoon (the e2e's sky on two phones: realweather.spec)
    const on = (name: (typeof WX_FIXTURES)[number], d: string, hm: string) => {
      const now = tokyo(d, hm);
      return realWeatherAt(wxFixture(name, now), now);
    };
    const clears = on('clears', '2026-06-10', '14:20');
    expect([clears?.sky, clears!.rainbow > 0, on('rain-pm', '2027-01-20', '13:00')?.sky, on('typhoon', '2026-08-09', '20:00')?.sky]).toEqual(['clear', true, 'snow', 'clear']);
    // two phones laying one on the same clock agree
    const now = tokyo('2026-06-10', '13:00');
    const { at: _a, ...one } = wxFixture('rain-pm', now), { at: _b, ...other } = wxFixture('rain-pm', now + 20 * 60_000);
    expect(one).toEqual(other);
  });

  it('a `wx` from the relay parses (known fields only), a bad one is dropped', () => {
    const now = tokyo('2026-06-10');
    const wx = all(now, 'c', { fx: [3] });
    expect(parseServer(JSON.stringify({ v: 3, kind: 'wx', ...wx, t: now, extra: 1 }))).toEqual({ v: 3, kind: 'wx', ...wx, t: now });
    const bad = [{ ...wx, s: 'cq' }, { ...wx, src: 'x' }, { ...wx, fx: [48] }, { ...wx, at: -1 }];
    expect(bad.map((b) => parseServer(JSON.stringify({ v: 3, kind: 'wx', ...b, t: now })))).toEqual(bad.map(() => null));
    expect(parseServer(JSON.stringify({ v: 2, kind: 'wx', ...wx, t: now }))).toBeNull();
  });
});

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe("the phone's timeline", () => {
  let kv: Mem;
  beforeEach(() => {
    kv = new Mem();
    configureStorage({ local: kv });
    resetWx();
  });

  it('keeps the newest from the relay, cached for opening offline; an older one is ignored', () => {
    const now = tokyo('2026-06-10');
    const heard: (Wx | null)[] = [];
    const off = onWx((w) => heard.push(w));
    expect(heldWx()).toBeNull();
    const a = all(now, 'r'), b = all(now + 30 * 60_000, 'c', { rev: 2 });
    takeWx(a);
    takeWx(b);
    takeWx(a); // older: ignored
    takeWx(b); // the same: nothing new
    off();
    expect([heard, heldWx()]).toEqual([[a, b], b]);
    // the next launch reads the cache
    resetWx();
    expect([heldWx(), JSON.parse(kv.getItem(LIVE.wx)!)]).toEqual([b, b]);
    kv.setItem(LIVE.wx, '{"h0":1,"s":"zz"}');
    resetWx();
    expect(heldWx()).toBeNull();
  });
});

describe("the island's mode (pref weatherMode)", () => {
  const ev = (when: string, who: 'A' | 'B' | 'G', data: object): EventRow => [when, who, `e${when}${who}`, 'pref', JSON.stringify(data)];
  const t = (hm: string) => new Date(`2026-11-04T${hm}:00+09:00`).toISOString();

  it('one for the island: the last anyone set wins, the guest too; unset, none; a bad value changes nothing', () => {
    const mode = (events: EventRow[]) => reduce({ metrics: [], events }).weatherMode;
    expect([
      mode([]),
      mode([ev(t('10:00'), 'A', { key: 'weatherMode', value: 'game' })]),
      mode([ev(t('10:00'), 'A', { key: 'weatherMode', value: 'game' }), ev(t('11:00'), 'B', { key: 'weatherMode', value: 'real' })]),
      mode([ev(t('10:00'), 'B', { key: 'weatherMode', value: 'game' }), ev(t('11:00'), 'A', { key: 'weatherMode', value: 'sunny' })]),
      mode([ev(t('10:00'), 'A', { key: 'weatherMode', value: 'game' }), ev(t('11:00'), 'G', { key: 'weatherMode', value: 'real' })]),
      mode([ev(t('10:00'), 'A', { person: 'B', key: 'weatherMode', value: 'game' })])
    ]).toEqual([undefined, 'game', 'real', 'game', 'real', undefined]);
  });

  it('the record: one slot for the island, anyone’s (the guest’s too)', () => {
    const at = Date.parse('2026-11-04T01:00:00Z');
    expect([
      eventSlot('pref', 'A', 'A', { key: 'weatherMode', value: 'game' }, at),
      eventSlot('pref', 'B', 'B', { key: 'weatherMode', value: 'real' }, at),
      eventSlot('pref', 'G', 'G', { key: 'weatherMode', value: 'real' }, at),
      eventSlot('pref', 'A', 'A', { key: 'weatherMode', value: 'x' }, at),
      prefTaken('weatherMode', 'real'),
      prefTaken('weatherMode', 'cloudy'),
      guestMayWrite('pref', { key: 'weatherMode', value: 'game' }),
      guestMayWrite('pref', { key: 'weatherMode', value: 'game', person: 'A' }),
      guestMayWrite('pref', { key: 'villagerName', value: 'x' })
    ]).toEqual(['pref|island|weatherMode', 'pref|island|weatherMode', 'pref|island|weatherMode', null, true, false, true, false, true]);
  });
});

describe('the critters’ sky at an instant (yieldSkyAt: a shared critter’s slot start)', () => {
  it('is the sky of that instant’s hour, not the live one: a slot started before the rain is a clear slot', () => {
    const now = tokyo('2026-06-10', '12:00') + 30_000;
    // 12 hours back clear, then rain from 12:00 on
    const wx = tl(now, 'c'.repeat(12) + 'r'.repeat(36));
    expect(yieldSkyAt(tokyo('2026-06-10', '12:00') - 10_000, 'seed', true, wx)).toBe('clear');
    expect(yieldSkyAt(now, 'seed', true, wx)).toBe('rain');
    // `game` mode: the seeded day's; the dev hook over all
    expect(yieldSkyAt(now, 'seed', false, wx)).toBe(weatherAt('2026-06-10', 12, 'seed').sky);
    expect(yieldSkyAt(now, 'seed', true, wx, 'snow')).toBe('snow');
  });
});
