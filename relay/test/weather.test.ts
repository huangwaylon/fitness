// The real weather (relay/src/weather.ts): recorded Open-Meteo responses (JMA's models for central Tokyo: a clear
// winter day, spring showers, a rainy-season day, a downpour, a typhoon, the snow of 2024-02-05 and today's forecast)
// mapped to golden timelines; the dead bands, the gap fill, the locked hours, the backoff and the revisions, with a
// fake fetch and a fixed clock.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tokyoDay, wxOf, type Wx } from '../../app/src/lib/contract/live-protocol.ts';
import { BACKOFF_MS, WX_EMPTY, changed, due, fetchTick, fixture, fold, highOf, mapHour, mapHours, omUrl, parseOpenMeteo, served, timeline, wxHealth, type FetchLike, type Hour, type WxState } from '../src/weather.ts';

const DIR = `${import.meta.dirname}/fixtures/open-meteo`;
const load = (f: string): { hourly: Record<string, unknown[]> } => JSON.parse(readFileSync(`${DIR}/${f}.json`, 'utf8'));
const FIXTURES = readdirSync(DIR).map((f) => f.replace(/\.json$/, ''));
const H = 3600_000;
/** Ten past the fixture's 36th hour from the end (12 past hours before it, the hour before those in the live one). */
const nowOf = (hours: Hour[]) => hours.at(-36)!.h * H + 10 * 60_000;
const hoursOf = (f: string) => parseOpenMeteo(load(f))!;
/** `n` letters of a timeline from hour `h`. */
const from = (wx: Wx | Omit<Wx, 'rev'> | null, h: number, n: number) => (wx ? wx.s.slice(h - wx.h0, h - wx.h0 + n) : '');
const hour = (o: Partial<Hour>): Hour => ({ h: 1, code: 0, mm: 0, cloud: 0, vis: null, temp: 15, ...o });

/** A fake fetch answering `body` (or a status, or never: aborted by its signal). */
function fakeFetch(answer: { body?: unknown; status?: number; hang?: boolean; throws?: boolean }): FetchLike {
  return async (_url, init) => {
    if (answer.throws) throw new TypeError('network down');
    if (answer.hang) {
      await new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(init.signal.reason)));
    }
    const status = answer.status ?? 200;
    return { ok: status === 200, status, json: async () => answer.body };
  };
}

describe('the real weather (relay)', () => {
  it('maps the recorded forecasts to their golden timelines', () => {
    const golden: Record<string, string> = {
      clear: 'cccccccccccccccccccccccccccccccccccccccccccccccc',
      showers: 'coorrrrrrrrrrrrrrrrocccooooccccccccccoorrrrrrrrr',
      tsuyu: 'rrrrrhhhhhhhhhhhhhhrrooooocccccccccccccccccccccc',
      downpour: 'cccrrrrrhhhhhhhrrrrrrrrrroooooooooooccccccccccco',
      typhoon: 'coorrrrhhhhhhhhhhrcccccccccccccccccccccccccccccc',
      snow: 'cccccccccoooossssssssssssooooooooooooooooooooccc',
      'live-2026-11-04': 'ccooooooorrrrrrrrrrrrrrroooooooccccccccccccrrccc'
    };
    const got: Record<string, string> = {};
    for (const f of FIXTURES) {
      const hours = hoursOf(f);
      const t = timeline(hours, null, nowOf(hours))!;
      got[f] = t.s;
      expect([t.h0, t.s.length]).toEqual([hours.at(-48)!.h, 48]);
    }
    expect(got).toEqual(golden);
  });

  it('never flickers for a single hour: no lone hour between two alike, no dry hour inside rain', () => {
    const bad: string[] = [];
    const wet = (c: string) => 'rhs'.includes(c);
    for (const f of FIXTURES) {
      const hours = hoursOf(f);
      const s = timeline(hours, null, nowOf(hours))!.s;
      for (let i = 1; i < s.length - 1; i++) {
        const [a, b, c] = [s[i - 1], s[i], s[i + 1]];
        if ((a === c && b !== a && wet(a) === wet(b)) || (wet(a) && wet(c) && !wet(b))) bad.push(`${f}@${i}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('the dead bands: rain from 0.5 mm, kept to 0.2; heavy from 4, kept to 2.5; cloudy from 85 %, kept to 60 %', () => {
    const cases: [Partial<Hour>, Parameters<typeof mapHour>[1], string][] = [
      [{ code: 51, mm: 0.3 }, 'c', 'o'], // light drizzle: cloudy
      [{ code: 51, mm: 0.5 }, 'c', 'r'],
      [{ code: 61, mm: 0.1 }, 'c', 'r'], // a rain code is rain
      [{ code: 3, mm: 0.3, cloud: 100 }, 'r', 'r'], // rain stays rain down to 0.2 mm
      [{ code: 3, mm: 0.1, cloud: 100 }, 'r', 'o'],
      [{ code: 63, mm: 3.9 }, 'r', 'r'],
      [{ code: 63, mm: 4 }, 'r', 'h'],
      [{ code: 63, mm: 2.6 }, 'h', 'h'], // heavy stays heavy down to 2.5
      [{ code: 63, mm: 2.4 }, 'h', 'r'],
      [{ code: 65, mm: 1 }, 'c', 'h'], // heavy rain, freezing rain, thunder: a downpour
      [{ code: 66, mm: 1 }, 'c', 'h'],
      [{ code: 95, mm: 0 }, 'c', 'h'],
      [{ code: 2, cloud: 84 }, 'c', 'c'],
      [{ code: 3, cloud: 85 }, 'c', 'o'],
      [{ code: 2, cloud: 61 }, 'o', 'o'],
      [{ code: 2, cloud: 59 }, 'o', 'c'],
      [{ code: 3, cloud: null }, 'c', 'o'], // no cloud cover: overcast by its code
      [{ code: 1, cloud: null }, null, 'c'],
      [{ code: 73, mm: 0.4 }, 'c', 's'], // a snow code
      [{ code: 61, mm: 1, temp: 1 }, 'c', 's'], // wet at 1 °C snows
      [{ code: 61, mm: 1, temp: 1.6 }, 'c', 'r'],
      [{ code: 61, mm: 1, temp: 1.9 }, 's', 's'], // snow stays snow up to 2 °C
      [{ code: 61, mm: 1, temp: 2.1 }, 's', 'r']
    ];
    const got = cases.map(([h, prev]) => mapHour(hour(h), prev).sky);
    expect(got).toEqual(cases.map((c) => c[2]));
  });

  it('fog: a fog code or under 1 km while dry, cloudy and kept as the hour\'s extra', () => {
    const fog = [mapHour(hour({ code: 45, cloud: 100 }), 'c'), mapHour(hour({ code: 48 }), null), mapHour(hour({ code: 1, vis: 600 }), 'c'), mapHour(hour({ code: 61, mm: 1, vis: 300 }), 'c')];
    expect(fog).toEqual([{ sky: 'o', fog: true }, { sky: 'o', fog: true }, { sky: 'o', fog: true }, { sky: 'r', fog: false }]);
    // a foggy morning (the clear day, its 07:00 and 08:00 fogged): `fx` names those hours
    const body = load('clear');
    const codes = [...body.hourly.weather_code];
    codes[7] = codes[8] = 45;
    const hours = parseOpenMeteo({ hourly: { ...body.hourly, weather_code: codes } })!;
    const t = timeline(hours, null, nowOf(hours))!;
    expect([t.s.slice(5, 10), t.fx]).toEqual(['ccooc', [7, 8]]);
  });

  it('the gap fill: one dry hour inside rain is rain, inside snow snow; one cloudy hour between clear ones clear', () => {
    const run = (cs: [number, number][]) => mapHours(cs.map(([code, mm], i) => hour({ h: i, code, mm, cloud: code === 3 ? 100 : 10 })), null).map((x) => x.sky).join('');
    expect(run([[61, 1], [3, 0], [61, 1]])).toBe('rrr');
    expect(run([[0, 0], [3, 0], [0, 0]])).toBe('ccc');
    expect(run([[71, 1], [3, 0], [71, 1]])).toBe('sss');
    expect(run([[0, 0], [61, 1], [0, 0]])).toBe('crc'); // a passing shower stays
  });

  it('checks a response strictly: bad data is null', () => {
    const good = load('clear');
    const with_ = (k: string, f: (a: unknown[]) => unknown[]) => ({ hourly: { ...good.hourly, [k]: f([...good.hourly[k]]) } });
    const bad = [
      null,
      'nope',
      {},
      { hourly: { time: [1] } },
      with_('weather_code', (a) => a.slice(1)), // lengths differ
      with_('weather_code', (a) => ((a[3] = 42), a)), // not a WMO code
      with_('precipitation', (a) => ((a[3] = -1), a)),
      with_('precipitation', (a) => ((a[3] = 'x'), a)),
      with_('cloud_cover', (a) => ((a[3] = 140), a)),
      with_('time', (a) => ((a[3] = (a[3] as number) + 60), a)) // not hourly
    ];
    expect(bad.map((b) => parseOpenMeteo(b))).toEqual(bad.map(() => null));
    // the hours up to the first without a code (the model's horizon)
    const short = parseOpenMeteo(with_('weather_code', (a) => a.map((x, i) => (i >= 30 ? null : x))))!;
    expect(short.length).toBe(30);
    expect(omUrl()).toMatch(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=35\.69&longitude=139\.75&models=jma_seamless&hourly=weather_code%2Cprecipitation%2Ccloud_cover%2Cvisibility%2Ctemperature_2m&timezone=GMT&timeformat=unixtime&past_hours=13&forecast_hours=36$/);
  });

  it('locks the hours that have begun, and the next from :45; revises the rest', () => {
    const hours = hoursOf('clear');
    const t0 = nowOf(hours); // :10
    const cur = Math.floor(t0 / H);
    const first = fold(WX_EMPTY, hours, t0, 'om')!;
    expect(first.send).toBe(true);
    // a later forecast says it rains from now on
    const wet = hours.map((h) => ({ ...h, code: 63, mm: 2 }));
    const at20 = fold(first.st, wet, t0 + 10 * 60_000, 'om')!;
    expect([from(at20.st.wx, cur - 12, 12), from(at20.st.wx, cur, 3)]).toEqual(['c'.repeat(12), 'crr']); // the hours begun stay clear; the next ones rain
    expect(at20.send).toBe(true);
    // a fetch at :46 locks the next hour; one at :55 can't change it, the hour after it can
    const at46 = fold(first.st, hours, t0 + 36 * 60_000, 'om')!;
    const at55 = fold(at46.st, wet, t0 + 45 * 60_000, 'om')!;
    expect(from(at55.st.wx, cur, 3)).toBe('ccr');
    // the hour turns: what was locked is what shows; it stays so whatever comes
    const next = fold(at55.st, wet, t0 + 55 * 60_000, 'om')!;
    expect([next.st.wx!.h0, from(next.st.wx, cur + 1, 2)]).toEqual([cur + 1 - 12, 'cr']);
  });

  it('a new revision only when the sky changes (or reaches 6 hours further)', () => {
    const hours = hoursOf('showers');
    const t0 = nowOf(hours);
    const a = fold(WX_EMPTY, hours, t0, 'om')!;
    const b = fold(a.st, hours, t0 + 30 * 60_000, 'om')!;
    expect([a.send, a.st.wx!.rev, b.send, b.st.wx!.rev, b.st.wx!.at]).toEqual([true, 1, false, 1, t0 + 30 * 60_000]);
    // the window slides an hour: nothing the phones hold changes
    const c = fold(b.st, hours, t0 + H, 'om')!;
    expect([c.send, c.st.wx!.rev, c.st.wx!.h0]).toEqual([false, 1, Math.floor(t0 / H) + 1 - 12]);
    // what a phone holds against a newer one: the same hours alike, an hour otherwise, 5 or 6 hours further
    const held: Wx = { h0: 100, s: 'cccrrr', at: 0, src: 'om', rev: 1 };
    const next = (h0: number, s: string, src: Wx['src'] = 'om') => ({ h0, s, at: h0 * H, src });
    expect([
      changed(held, next(101, 'ccrrr')),
      changed(held, next(101, 'ccrrrccccc')), // 5 hours further
      changed(held, next(101, 'ccrrrcccccc')), // 6
      changed(held, next(101, 'corrr')),
      changed(held, next(107, 'cc')), // it no longer covers the hour
      changed(held, next(100, 'cccrrr', 'fx')),
      changed(null, next(100, 'c'))
    ]).toEqual([false, false, true, true, true, true, true]);
  });

  it('fetches when due: none kept, 30 minutes on, past :45 once; never inside the backoff', () => {
    const hours = hoursOf('clear');
    const t0 = nowOf(hours); // :10
    const st = fold(WX_EMPTY, hours, t0, 'om')!.st;
    const got = [
      due(WX_EMPTY, t0),
      due(st, t0 + 19 * 60_000), // :29
      due(st, t0 + 30 * 60_000), // :40, 30 minutes on
      due(st, t0 + 35 * 60_000), // :45
      due({ ...st, wx: { ...st.wx!, at: t0 + 35 * 60_000 } }, t0 + 40 * 60_000) // fetched at :45, :50
    ];
    expect(got).toEqual([true, false, true, true, false]);
    const failed = (n: number): WxState => ({ wx: st.wx, fails: n, failAt: t0 });
    const backoff = [1, 2, 3, 4].map((n) => [due(failed(n), t0 + BACKOFF_MS[Math.min(n, 3) - 1] - 1), due(failed(n), t0 + BACKOFF_MS[Math.min(n, 3) - 1])]);
    expect(backoff).toEqual([[false, true], [false, true], [false, true], [false, true]]);
  });

  it('a failure keeps the good timeline and backs off: a 500, a bad body, a timeout, no network', async () => {
    const hours = hoursOf('live-2026-11-04');
    const t0 = nowOf(hours);
    const ok = await fetchTick(WX_EMPTY, t0, fakeFetch({ body: load('live-2026-11-04') }));
    expect([ok.send, ok.st.wx?.s, ok.st.fails, ok.fail]).toEqual([true, 'ccooooooorrrrrrrrrrrrrrroooooooccccccccccccrrccc', 0, undefined]);
    const results = await Promise.all([
      fetchTick(ok.st, t0 + H, fakeFetch({ status: 500 })),
      fetchTick(ok.st, t0 + H, fakeFetch({ body: { hourly: { time: 'x' } } })),
      fetchTick(ok.st, t0 + H, fakeFetch({ hang: true }), omUrl(), 20),
      fetchTick(ok.st, t0 + H, fakeFetch({ throws: true })),
      // a forecast that doesn't reach the current hour
      fetchTick(ok.st, t0 + 3 * 24 * H, fakeFetch({ body: load('live-2026-11-04') }))
    ]);
    expect(results.map((r) => [r.fail, r.send, r.st.wx, r.st.fails, r.st.failAt])).toEqual([
      ['status 500', false, ok.st.wx, 1, t0 + H],
      ['bad body', false, ok.st.wx, 1, t0 + H],
      ['timeout', false, ok.st.wx, 1, t0 + H],
      ['fetch network down', false, ok.st.wx, 1, t0 + H],
      ['no current hour', false, ok.st.wx, 1, t0 + 3 * 24 * H]
    ]);
    // the next good one clears the failures
    const again = await fetchTick(results[0].st, t0 + H, fakeFetch({ body: load('live-2026-11-04') }));
    expect([again.st.fails, again.st.failAt]).toEqual([0, undefined]);
  });

  it('carries the Tokyo day’s high (しずえの ニュース): rounded, of that day’s hours only; a new high is sent', () => {
    const hours = hoursOf('clear');
    const t0 = nowOf(hours), day = tokyoDay(t0);
    const today = hours.filter((h) => tokyoDay(h.h * H) === day).map((h) => h.temp!);
    const wx = timeline(hours, null, t0)!;
    expect(wx.hi).toEqual([day, Math.round(Math.max(...today))]);
    expect(highOf(hours.slice(0, 5), day)).toBeNull(); // (too few of the day's hours)
    const warmer = timeline(hours.map((h) => ({ ...h, temp: h.temp! + 3 })), null, t0)!;
    expect(changed({ ...wx, rev: 1 }, warmer)).toBe(true);
    expect(changed({ ...wx, rev: 1 }, timeline(hours, null, t0)!)).toBe(false);
    expect(wxOf({ ...wx, rev: 1 })?.hi).toEqual(wx.hi);
    expect([{ ...wx, rev: 1, hi: [day, 61] }, { ...wx, rev: 1, hi: [day] }, { ...wx, rev: 1, hi: [day, 2.5] }].map(wxOf)).toEqual([null, null, null]);
  });

  it('serves a timeline for 36 hours while it covers the hour; the wire form parses on both sides', () => {
    const hours = hoursOf('tsuyu');
    const t0 = nowOf(hours);
    const st = fold(WX_EMPTY, hours, t0, 'om')!.st;
    const wx = st.wx!;
    expect([served(wx, t0), served(wx, t0 + 35 * H), served(wx, t0 + 36 * H), served(null, t0)]).toEqual([wx, wx, null, null]);
    const wire = JSON.stringify({ v: 3, kind: 'wx', ...wx, t: t0 });
    expect(wire.length).toBeLessThan(200);
    expect(wxOf(JSON.parse(wire))).toEqual(wx);
    const bad = [{ ...wx, s: 'cx' }, { ...wx, h0: 1.5 }, { ...wx, fx: [99] }, { ...wx, src: 'jma' }, { ...wx, s: 'c'.repeat(49) }, { ...wx, rev: -1 }];
    expect(bad.map(wxOf)).toEqual(bad.map(() => null));
    expect(wxHealth(st, t0 + 2 * H)).toEqual({ at: t0, src: 'om', age: 120, hours: 34, fails: 0 });
  });

  it('a fixture (the /admin op) from the current hour, then a real forecast replaces it whole', () => {
    const hours = hoursOf('clear');
    const t0 = nowOf(hours);
    const fx = fixture(WX_EMPTY, 'rrhh', [1], t0)!;
    expect(fx.wx).toEqual({ h0: Math.floor(t0 / H), s: 'rrhh', fx: [1], at: t0, src: 'fx', rev: 1 } satisfies Wx);
    expect([fixture(WX_EMPTY, 'rx', undefined, t0), fixture(WX_EMPTY, 'rr', [2], t0)]).toEqual([null, null]);
    const real = fold(fx, hours, t0 + 60_000, 'om')!;
    expect([real.send, from(real.st.wx, Math.floor(t0 / H), 1), real.st.wx!.rev]).toEqual([true, 'c', 2]);
  });
});
