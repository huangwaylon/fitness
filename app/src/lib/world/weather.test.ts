// Weather days (docs/design.md "Weather"): seeded by the date so both phones agree, about one wet day in six (one in four
// in winter, as snow), NH's rainbow, fog and aurora rules, the always-fine days, and the forced weathers.
import { describe, expect, it } from 'vitest';
import { DAY_START, dayWeather, musicWeather, skyOf, weatherAt, type DayWeather } from './weather.ts';
import { showerNight } from './meteor.ts';
import { trackFor } from '#lib/sound/hourly.ts';
import { addDays } from '#lib/time/dates.ts';

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));
const YEARS = days('2026-01-01', 365 * 4);
const month = (d: string) => Number(d.slice(5, 7));
const winter = (d: string) => month(d) === 12 || month(d) <= 2;
const all = YEARS.map((d) => [d, dayWeather(d)] as [string, DayWeather]);

describe('weather days', () => {
  it('the same date gives the same weather (both phones), another seed another island', () => {
    for (const d of YEARS.slice(0, 60)) expect(dayWeather(d)).toEqual(dayWeather(d));
    expect(YEARS.slice(0, 120).map((d) => dayWeather(d, 'x').pattern)).not.toEqual(YEARS.slice(0, 120).map((d) => dayWeather(d).pattern));
  });

  it('about one day in six is wet, one in four in winter, and only winter snows', () => {
    const rest = all.filter(([d]) => !winter(d)), cold = all.filter(([d]) => winter(d));
    const wet = (l: typeof all) => l.filter(([, w]) => w.pattern !== 'clear').length / l.length;
    expect(wet(rest)).toBeGreaterThan(0.12);
    expect(wet(rest)).toBeLessThan(0.21);
    expect(wet(cold)).toBeGreaterThan(0.18);
    expect(wet(cold)).toBeLessThan(0.3);
    for (const [, w] of rest) expect(w.pattern).not.toMatch(/snow/);
    for (const [, w] of cold) expect(['clear', 'snow', 'heavy-snow']).toContain(w.pattern);
    // every kind of day turns up
    expect(new Set(all.map(([, w]) => w.pattern))).toEqual(new Set(['clear', 'rain', 'heavy', 'am-rain', 'clears', 'snow', 'heavy-snow']));
  });

  it('NH fireworks days and meteor showers are always fine', () => {
    for (const [d, w] of all) {
      const [y, m, day] = d.split('-').map(Number);
      const sunday = new Date(Date.UTC(y, m - 1, day)).getUTCDay() === 0;
      if ((m === 8 && sunday) || (m === 12 && day === 31) || (m === 1 && day === 1) || showerNight(d)) expect(w.pattern).toBe('clear');
    }
  });

  it('fog: fine mornings October–March, at 07:00 only, rare', () => {
    const fogs = all.filter(([, w]) => w.fog);
    expect(fogs.length).toBeGreaterThan(20);
    for (const [d, w] of fogs) {
      expect(w.pattern).toBe('clear');
      expect(month(d) >= 10 || month(d) <= 3).toBe(true);
      expect(weatherAt(d, 7).fog).toBe(true);
      expect(weatherAt(d, 6).fog || weatherAt(d, 8).fog).toBe(false);
    }
  });

  it('the aurora: fine winter nights 19:00–04:00, never on a meteor shower night', () => {
    const lit = all.filter(([, w]) => w.aurora);
    expect(lit.length).toBeGreaterThan(10);
    for (const [d, w] of lit) {
      expect(winter(d) && w.pattern === 'clear' && !showerNight(d)).toBe(true);
      expect(weatherAt(d, 21).aurora).toBe(true);
      expect(weatherAt(addDays(d, 1), 3).aurora).toBe(true); // after midnight: still that evening's night
      expect(weatherAt(d, 12).aurora).toBe(false);
    }
  });

  it('a day that clears: heavy rain until 16:00, the rainbow 16:00–17:00, now and then double', () => {
    const clears = all.filter(([, w]) => w.pattern === 'clears');
    expect(clears.length).toBeGreaterThan(20);
    for (const [d, w] of clears) {
      expect(weatherAt(d, 15).sky).toBe('heavy');
      expect(weatherAt(d, 16)).toMatchObject({ sky: 'clear', rainbow: w.double ? 2 : 1 });
      expect(weatherAt(d, 17).rainbow).toBe(0);
    }
    expect(all.some(([, w]) => w.double)).toBe(true);
    for (const [, w] of all) if (w.pattern !== 'clears') expect(w.double).toBe(false);
  });

  it('the hours of a pattern; before 05:00 belongs to the day before', () => {
    expect(skyOf('am-rain', 9)).toBe('rain');
    expect(skyOf('am-rain', 13)).toBe('clear');
    expect(skyOf('heavy-snow', 13)).toBe('snow');
    const wet = all.find(([, w]) => w.pattern === 'rain')![0];
    expect(weatherAt(addDays(wet, 1), DAY_START - 1).sky).toBe('rain');
  });

  it('forced weathers, any hour; the music follows the sky', () => {
    expect(weatherAt('2026-06-10', 3, undefined, 'heavy').sky).toBe('heavy');
    expect(weatherAt('2026-06-10', 12, undefined, 'aurora')).toEqual({ sky: 'clear', fog: false, rainbow: 0, aurora: true });
    expect(weatherAt('2026-06-10', 12, undefined, 'rainbow').rainbow).toBe(1);
    expect(weatherAt('2026-06-10', 12, undefined, 'fog').fog).toBe(true);
    expect([musicWeather('clear'), musicWeather('rain'), musicWeather('heavy'), musicWeather('snow')]).toEqual(['sunny', 'rain', 'rain', 'snow']);
    // the hour's rain arrangement when there is one, else the sunny one of that hour
    const files = { sunny: { '14': { file: 's14', start: 0 } }, rain: { '14': { file: 'r14', start: 0 } } };
    expect(trackFor(14, musicWeather('heavy'), files)?.key).toBe('rain/14');
    expect(trackFor(14, musicWeather('snow'), files)?.key).toBe('sunny/14');
    expect(trackFor(14, musicWeather('clear'), files)?.key).toBe('sunny/14');
  });
});
