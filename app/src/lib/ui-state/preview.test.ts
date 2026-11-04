import { describe, expect, it } from 'vitest';
import { devChoice, PREVIEW_EVENTS, resolvePreview, savedFrom, type Saved } from './preview.ts';

const TODAY = '2026-11-04';
const saved = (o: Partial<Saved>): Saved => ({ day: TODAY, event: null, season: null, weather: null, tod: null, ...o });
const none = { event: null, season: null, foliage: null, month: null, tod: null, weather: null, on: false };

describe('resolvePreview', () => {
  it('is the real day with nothing set', () => {
    expect(resolvePreview({}, null, TODAY)).toEqual(none);
    expect(resolvePreview({}, saved({}), TODAY)).toEqual(none);
  });

  it('shows the setting on the day it was set, and lapses after it', () => {
    const s = saved({ season: 'winter', weather: 'snow', tod: 'dusk' });
    expect(resolvePreview({}, s, TODAY)).toEqual({ ...none, season: 'winter', foliage: 'snow', month: 1, weather: 'snow', tod: 'dusk', on: true });
    expect(resolvePreview({}, s, '2026-11-05')).toEqual(none);
  });

  it('gives an event its day’s look and hour', () => {
    expect(resolvePreview({}, saved({ event: 'halloween' }), TODAY)).toMatchObject({ event: 'halloween', season: 'autumn', foliage: 'fall', month: 10, tod: 'night', weather: null, on: true });
    expect(resolvePreview({}, saved({ event: 'cherry' }), TODAY)).toMatchObject({ season: 'spring', foliage: 'blossom', month: 4, tod: null });
    expect(resolvePreview({}, saved({ event: 'toy-day' }), TODAY)).toMatchObject({ season: 'winter', foliage: 'snow', month: 12 });
    expect(resolvePreview({}, saved({ event: 'fireworks' }), TODAY)).toMatchObject({ season: 'summer', tod: 'night', weather: 'clear' });
    // a meteor shower is any clear night: the season stays the real one
    expect(resolvePreview({}, saved({ event: 'shower' }), TODAY)).toMatchObject({ season: null, month: null, tod: 'night', weather: 'clear' });
  });

  it('every event resolves', () => {
    for (const event of PREVIEW_EVENTS) expect(resolvePreview({}, saved({ event }), TODAY).event).toBe(event);
  });

  it('a picked season, time or weather wins over the event’s own', () => {
    expect(resolvePreview({}, saved({ event: 'halloween', season: 'spring', tod: 'day', weather: 'rain' }), TODAY))
      .toMatchObject({ event: 'halloween', season: 'spring', foliage: 'blossom', month: 4, tod: 'day', weather: 'rain' });
  });

  it('a dev param wins over the setting, field by field; the dev params alone are not the setting', () => {
    const s = saved({ event: 'maple', tod: 'dusk' });
    expect(resolvePreview({ event: 'wedding', weather: 'fog' }, s, TODAY)).toMatchObject({ event: 'wedding', tod: 'dusk', weather: 'fog', on: true });
    expect(resolvePreview({ event: 'halloween' }, null, TODAY)).toMatchObject({ event: 'halloween', tod: 'night', on: false });
  });
});

describe('savedFrom', () => {
  it('keeps only what it knows', () => {
    expect(savedFrom({ day: TODAY, event: 'halloween', season: 'monsoon', weather: 'hail', tod: 'night' })).toEqual(saved({ event: 'halloween', tod: 'night' }));
    expect(savedFrom(null)).toBeNull();
    expect(savedFrom('x')).toBeNull();
    expect(savedFrom({ event: 'halloween' })).toBeNull();
  });
});

describe('devChoice', () => {
  it('reads ?event=, ?fireworks, ?shower, ?weather= (the hooks on) and ?season=, ?theme=', () => {
    expect(devChoice('?demo&event=halloween&weather=rain')).toEqual({ event: 'halloween', season: null, tod: null, weather: 'rain' });
    expect(devChoice('?demo&fireworks')).toMatchObject({ event: 'fireworks' });
    expect(devChoice('?demo&shower')).toMatchObject({ event: 'shower' });
    expect(devChoice('?season=winter&theme=night')).toMatchObject({ season: 'winter', tod: 'night' });
    expect(devChoice('?season=monsoon&theme=dim&event=nope')).toMatchObject({ season: null, tod: null, event: null });
  });
});
