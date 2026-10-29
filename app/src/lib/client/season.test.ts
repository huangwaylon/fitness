import { describe, expect, it } from 'vitest';
import { deriveTheme, foliageFor, previewParams, seasonFor, todFor } from './season.ts';

const at = (s: string) => new Date(s); // local time

describe('season windows (NH, northern hemisphere)', () => {
  it.each([
    ['2026-02-24T12:00', 'winter', 'snow'],
    ['2026-02-25T12:00', 'spring', 'green'],
    ['2026-03-20T12:00', 'spring', 'green'],
    ['2026-03-31T23:00', 'spring', 'green'],
    ['2026-04-01T08:00', 'spring', 'blossom'],
    ['2026-04-10T20:00', 'spring', 'blossom'],
    ['2026-04-11T08:00', 'spring', 'green'],
    ['2026-05-31T12:00', 'spring', 'green'],
    ['2026-06-01T12:00', 'summer', 'green'],
    ['2026-09-15T12:00', 'summer', 'green'],
    ['2026-09-16T12:00', 'autumn', 'green'],
    ['2026-10-15T12:00', 'autumn', 'green'],
    ['2026-10-16T12:00', 'autumn', 'fall'],
    ['2026-10-28T12:00', 'autumn', 'fall'],
    ['2026-11-20T12:00', 'autumn', 'fall'],
    ['2026-12-10T12:00', 'autumn', 'fall'],
    ['2026-12-11T12:00', 'winter', 'snow'],
    ['2027-01-15T12:00', 'winter', 'snow']
  ])('%s → %s / %s', (d, season, foliage) => {
    expect(seasonFor(at(d))).toBe(season);
    expect(foliageFor(at(d))).toBe(foliage);
  });
});

describe('time of day follows the clock', () => {
  it.each([
    ['04:59', 'night'], ['05:00', 'dawn'], ['06:59', 'dawn'], ['07:00', 'day'], ['12:26', 'day'],
    ['15:59', 'day'], ['16:00', 'dusk'], ['18:59', 'dusk'], ['19:00', 'night'], ['23:30', 'night']
  ])('%s → %s', (hm, tod) => expect(todFor(at(`2026-10-29T${hm}`))).toBe(tod));

  it('OS dark mode restyles the chrome only, never the sky', () => {
    const t = deriveTheme(at('2026-10-29T12:26'), { systemDark: true });
    expect(t.night).toBe(true);
    expect(t.tod).toBe('day');
  });

  it('chrome night 19–06 by the clock', () => {
    expect(deriveTheme(at('2026-10-29T05:30')).night).toBe(true);
    expect(deriveTheme(at('2026-10-29T05:30')).tod).toBe('dawn');
    expect(deriveTheme(at('2026-10-29T06:30')).night).toBe(false);
  });
});

describe('previews', () => {
  it('?season= shows that season’s signature foliage', () => {
    expect(deriveTheme(at('2026-10-29T12:00'), { season: 'spring' })).toMatchObject({ season: 'spring', foliage: 'blossom' });
    expect(deriveTheme(at('2026-10-29T12:00'), { season: 'winter' }).foliage).toBe('snow');
  });
  it('?theme= forces chrome and sky', () => {
    expect(deriveTheme(at('2026-10-29T12:00'), { theme: 'night' })).toMatchObject({ night: true, tod: 'night' });
    expect(deriveTheme(at('2026-10-29T22:00'), { theme: 'day' })).toMatchObject({ night: false, tod: 'day' });
    expect(deriveTheme(at('2026-10-29T17:00'), { theme: 'day' }).tod).toBe('dusk');
  });
  it('parses only valid params', () => {
    expect(previewParams('?demo&season=spring&theme=night')).toEqual({ season: 'spring', theme: 'night' });
    expect(previewParams('?demo&season=monsoon&theme=dim')).toEqual({ season: null, theme: null });
    expect(previewParams('?demo')).toEqual({ season: null, theme: null });
  });
});
