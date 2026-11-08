import { describe, expect, it } from 'vitest';
import { reduce } from '#lib/model/state.ts';
import { eventSlot, prefTaken, validEventData } from '#lib/contract/record.ts';
import { guestMayWrite } from '#lib/contract/guest.ts';
import type { EventRow } from '#lib/contract/api.ts';
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

describe("the island's look (pref seasonLook): one for the island, anyone's", () => {
  const ev = (hm: string, who: 'A' | 'B' | 'G', data: object): EventRow => [new Date(`2026-11-04T${hm}:00+09:00`).toISOString(), who, `e${hm}${who}`, 'pref', JSON.stringify(data)];
  const look = (events: EventRow[]) => reduce({ metrics: [], events }).seasonLook;

  it('the model: the last anyone set wins, the guest too; null is 自動; a malformed one or a `person` changes nothing', () => {
    const halloween = { event: 'halloween', season: null, weather: null, tod: null };
    expect([
      look([]),
      look([ev('10:00', 'A', { key: 'seasonLook', value: halloween })]),
      look([ev('10:00', 'A', { key: 'seasonLook', value: halloween }), ev('11:00', 'G', { key: 'seasonLook', value: { season: 'winter' } })]),
      look([ev('10:00', 'A', { key: 'seasonLook', value: halloween }), ev('11:00', 'B', { key: 'seasonLook', value: null })]),
      look([ev('10:00', 'A', { key: 'seasonLook', value: halloween }), ev('11:00', 'B', { key: 'seasonLook', value: { colour: 'red' } })]),
      look([ev('10:00', 'A', { person: 'B', key: 'seasonLook', value: halloween })])
    ]).toEqual([undefined, halloween, { season: 'winter' }, null, halloween, undefined]);
  });

  it('the record: one slot for the island, the guest may write it (never with a `person`); a malformed one refused', () => {
    const at = Date.parse('2026-11-04T01:00:00Z');
    expect([
      eventSlot('pref', 'A', 'A', { key: 'seasonLook', value: { tod: 'night' } }, at),
      eventSlot('pref', 'G', 'G', { key: 'seasonLook', value: null }, at),
      eventSlot('pref', 'A', 'A', { key: 'seasonLook', value: 'night' }, at),
      prefTaken('seasonLook', { event: 'a-later-event' }),
      validEventData('pref', { key: 'seasonLook', value: { event: 'halloween', season: 'autumn', weather: 'rain', tod: 'night' } }, at),
      validEventData('pref', { key: 'seasonLook', value: { colour: 'red' } }, at),
      validEventData('pref', { key: 'seasonLook', value: { tod: 'Night time' } }, at),
      guestMayWrite('pref', { key: 'seasonLook', value: null }),
      guestMayWrite('pref', { key: 'seasonLook', value: null, person: 'A' })
    ]).toEqual(['pref|island|seasonLook', 'pref|island|seasonLook', null, true, true, false, false, true, false]);
  });
});
