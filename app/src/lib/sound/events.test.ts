// Event music by Tokyo date and hour (docs/design.md#event-music), and K.K.'s song list (#kk-slider).
import { describe, expect, it } from 'vitest';
import { EVENT_MUSIC_IDS, eventMusicAt, msToNextEdge } from './events.ts';
import { nthWeekday } from '#lib/time/dates.ts';
import { kkPick, kkTracks } from './kk.ts';
import { AUDIO } from './manifest.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const at = (s: string) => eventMusicAt(new Date(`${s}+09:00`));

describe('event music schedule (Tokyo)', () => {
  it('Halloween: Oct 31 from 17:00 to midnight', () => {
    expect(at('2026-10-31T16:59:59')).toBeNull();
    expect(at('2026-10-31T17:00:00')).toEqual({ id: 'halloween' });
    expect(at('2026-10-31T23:59:59')).toEqual({ id: 'halloween' });
    expect(at('2026-11-01T00:00:00')).toBeNull();
    expect(at('2026-10-30T20:00:00')).toBeNull();
  });
  it('reads the Tokyo clock, not the device zone', () => {
    // 08:00 UTC is 17:00 in Tokyo
    expect(eventMusicAt(new Date('2026-10-31T08:00:00Z'))).toEqual({ id: 'halloween' });
    expect(eventMusicAt(new Date('2026-10-31T07:59:59Z'))).toBeNull();
  });
  it('the 4th Thursday of November, 2026–2030', () => {
    expect([2026, 2027, 2028, 2029, 2030].map((y) => nthWeekday(y, 11, 4, 4))).toEqual(['2026-11-26', '2027-11-25', '2028-11-23', '2029-11-22', '2030-11-28']);
    for (const y of [2026, 2027, 2028, 2029, 2030]) expect(eventMusicAt(new Date(`${nthWeekday(y, 11, 4, 4)}T12:00:00+09:00`))).toEqual({ id: 'turkey-day' });
  });
  it('Turkey Day: 09:00 to midnight on that Thursday only', () => {
    expect(at('2026-11-26T08:59:59')).toBeNull();
    expect(at('2026-11-26T09:00:00')).toEqual({ id: 'turkey-day' });
    expect(at('2026-11-26T23:59:59')).toEqual({ id: 'turkey-day' });
    expect(at('2026-11-27T00:00:00')).toBeNull();
    expect(at('2026-11-19T12:00:00')).toBeNull(); // the 3rd Thursday
    expect(at('2030-11-28T12:00:00')).toEqual({ id: 'turkey-day' });
    expect(at('2030-11-21T12:00:00')).toBeNull();
  });
  it('New Year: Happy New Year! at midnight, then the fireworks', () => {
    expect(at('2027-01-01T00:00:00')).toEqual({ id: 'new-year-0am', intro: 'happy-new-year' });
    expect(at('2027-01-01T00:01:59')).toEqual({ id: 'new-year-0am', intro: 'happy-new-year' });
    expect(at('2027-01-01T00:02:00')).toEqual({ id: 'new-year-0am' }); // opened later: no jingle
    expect(at('2027-01-01T01:59:59')).toEqual({ id: 'new-year-0am' });
  });
  it('the calmer music from 02:00, New Year\'s Day for NH\'s whole day (05:00 → 05:00)', () => {
    expect(at('2027-01-01T02:00:00')).toEqual({ id: 'new-year-2am' });
    expect(at('2027-01-01T04:59:59')).toEqual({ id: 'new-year-2am' });
    expect(at('2027-01-01T05:00:00')).toEqual({ id: 'new-years-day' });
    expect(at('2027-01-01T23:59:59')).toEqual({ id: 'new-years-day' });
    expect(at('2027-01-02T00:00:00')).toEqual({ id: 'new-years-day' });
    expect(at('2027-01-02T04:59:59')).toEqual({ id: 'new-years-day' });
    expect(at('2027-01-02T05:00:00')).toBeNull();
  });
  it("Dec 31's countdown: 23:00, 23:30, 23:50, 23:55, each to the next; midnight is New Year's", () => {
    expect(at('2026-12-31T22:59:59')).toBeNull();
    expect(at('2026-12-31T23:00:00')).toEqual({ id: 'countdown-2300' });
    expect(at('2026-12-31T23:29:59')).toEqual({ id: 'countdown-2300' });
    expect(at('2026-12-31T23:30:00')).toEqual({ id: 'countdown-2330' });
    expect(at('2026-12-31T23:49:59')).toEqual({ id: 'countdown-2330' });
    expect(at('2026-12-31T23:50:00')).toEqual({ id: 'countdown-2350' });
    expect(at('2026-12-31T23:54:59')).toEqual({ id: 'countdown-2350' });
    expect(at('2026-12-31T23:55:00')).toEqual({ id: 'countdown-2355' });
    expect(at('2026-12-31T23:59:59')).toEqual({ id: 'countdown-2355' });
    expect(at('2027-01-01T00:00:00')?.intro).toBe('happy-new-year');
    expect(at('2026-12-30T23:30:00')).toBeNull();
  });
  it('the boundaries inside an hour are timed to the second, never polled (msToNextEdge)', () => {
    const ms = (s: string) => msToNextEdge(new Date(`${s}+09:00`));
    expect(ms('2026-12-31T23:00:00')).toBe(30 * 60_000);
    expect(ms('2026-12-31T23:29:59')).toBe(1000);
    expect(ms('2026-12-31T23:30:00')).toBe(20 * 60_000);
    expect(ms('2026-12-31T23:52:30')).toBe(150_000);
    expect(ms('2026-12-31T23:55:00')).toBeNull(); // midnight is the hour's
    expect(ms('2026-12-31T22:10:00')).toBeNull(); // 23:00 too
    expect(ms('2027-01-01T00:00:30')).toBeNull(); // the midnight jingle plays to its end
    expect(ms('2026-07-15T12:34:56')).toBeNull();
  });
  it('Toy Day: Dec 24 05:00–24:00, the snowy arrangement in snow (the plain one if it has no file)', () => {
    expect(at('2026-12-24T04:59:59')).toBeNull();
    expect(at('2026-12-24T05:00:00')).toEqual({ id: 'toy-day' });
    expect(at('2026-12-24T23:59:59')).toEqual({ id: 'toy-day' });
    expect(at('2026-12-25T00:00:00')).toBeNull();
    expect(eventMusicAt(new Date('2026-12-24T12:00:00+09:00'), 'snow')).toEqual({ id: 'toy-day-snow', alt: 'toy-day' });
    expect(eventMusicAt(new Date('2026-12-24T12:00:00+09:00'), 'rain')).toEqual({ id: 'toy-day' });
  });
  it('Bunny Day: Easter Sunday 05:00–24:00 only (not the celebrations before it)', () => {
    expect(at('2027-03-28T04:59:59')).toBeNull();
    expect(at('2027-03-28T05:00:00')).toEqual({ id: 'bunny-day' });
    expect(at('2027-03-28T23:59:59')).toEqual({ id: 'bunny-day' });
    expect(at('2027-03-29T00:00:00')).toBeNull();
    expect(at('2027-03-21T12:00:00')).toBeNull(); // Zipper's first day: the hour's music
    expect(at('2027-03-25T12:00:00')).toBeNull();
    expect(at('2026-04-05T12:00:00')).toEqual({ id: 'bunny-day' });
  });
  it('Festivale: the Monday before Ash Wednesday (Easter − 48), 05:00–24:00', () => {
    for (const d of ['2026-02-16', '2027-02-08', '2028-02-28']) {
      expect(new Date(`${d}T12:00:00Z`).getUTCDay()).toBe(1);
      expect(at(`${d}T05:00:00`)).toEqual({ id: 'festivale' });
      expect(at(`${d}T23:59:59`)).toEqual({ id: 'festivale' });
      expect(at(`${d}T04:59:59`)).toBeNull();
    }
    expect(at('2026-02-17T12:00:00')).toBeNull(); // Shrove Tuesday
  });
  it('the Fireworks Show: August Sundays 19:00–24:00', () => {
    expect(at('2027-08-01T18:59:59')).toBeNull();
    expect(at('2027-08-01T19:00:00')).toEqual({ id: 'fireworks-show' });
    expect(at('2027-08-01T23:59:59')).toEqual({ id: 'fireworks-show' });
    expect(at('2027-08-02T00:00:00')).toBeNull();
    expect(at('2027-08-07T20:00:00')).toBeNull(); // a Saturday
    expect(at('2027-07-25T20:00:00')).toBeNull(); // a July Sunday
    expect(at('2027-08-29T20:00:00')).toEqual({ id: 'fireworks-show' });
  });
  it('our wedding day: the wedding 06:00–19:00, its party 19:00–24:00, each the other when it has no file', () => {
    expect(at('2027-10-08T05:59:59')).toBeNull();
    expect(at('2027-10-08T06:00:00')).toEqual({ id: 'wedding', alt: 'wedding-party' });
    expect(at('2027-10-08T18:59:59')).toEqual({ id: 'wedding', alt: 'wedding-party' });
    expect(at('2027-10-08T19:00:00')).toEqual({ id: 'wedding-party', alt: 'wedding' });
    expect(at('2027-10-08T23:59:59')).toEqual({ id: 'wedding-party', alt: 'wedding' });
    expect(at('2027-10-09T00:00:00')).toBeNull();
    expect(at('2027-06-06T12:00:00')).toBeNull(); // a June Sunday (the arch): no music of its own
  });
  it("every track has NH's title in ja and en (the settings' note, the Now Playing tile, the Media Session)", () => {
    for (const id of EVENT_MUSIC_IDS) {
      expect((ja as Record<string, string>)[`sound.title.${id}`], id).toBeTruthy();
      expect((en as Record<string, string>)[`sound.title.${id}`], id).toBeTruthy();
    }
  });
  it('an ordinary day has none', () => {
    for (const s of ['2026-07-15T12:00:00', '2026-12-25T20:00:00', '2027-02-01T00:30:00']) expect(at(s)).toBeNull();
  });
  it("the manifest's event tracks: known ids; loops with a period end, one-shots from 0", () => {
    const ONE_SHOTS = new Set(['happy-new-year', 'bee-stung', 'turkey-cooking-start', 'turkey-cooking-done', 'kimedance-done', 'happy-birthday']);
    for (const id of Object.keys(AUDIO.events) as (typeof EVENT_MUSIC_IDS)[number][]) {
      expect(EVENT_MUSIC_IDS).toContain(id);
      const t = AUDIO.events[id]!;
      if (ONE_SHOTS.has(id)) expect(t).toMatchObject({ start: 0 });
      else expect(t.end).toBeGreaterThan(t.start);
      expect(t.gain).toBeGreaterThanOrEqual(-12);
      expect(t.gain).toBeLessThanOrEqual(6);
    }
  });
});

describe('K.K. songs (kk.ts)', () => {
  it('the list: NH’s official titles, one file each under kk/, in the song-list order', () => {
    // the user's NH rip's nine among them in that order (the rest the GameCube / e+ live recordings: 73 songs, all
    // but NH's new ones)
    const nine = [
      ['kk-chorale', 'けけさんびか', 'K.K. Chorale'],
      ['kk-march', 'けけマーチ', 'K.K. March'],
      ['kk-waltz', 'けけワルツ', 'K.K. Waltz'],
      ['kk-swing', 'けけスウィング', 'K.K. Swing'],
      ['kk-bossa', 'けけボッサ', 'K.K. Bossa'],
      ['kk-salsa', 'けけサルサ', 'K.K. Salsa'],
      ['kk-reggae', 'けけレゲエ', 'K.K. Reggae'],
      ['kk-rock', 'けけロック', 'K.K. Rock'],
      ['kk-rockin', 'けけのロケンロール', "Rockin' K.K."]
    ];
    expect(kkTracks.filter((k) => nine.some(([id]) => id === k.id)).map((k) => [k.id, k.ja, k.en])).toEqual(nine);
    expect(kkTracks).toHaveLength(73);
    expect(kkTracks.find((k) => k.id === 'kk-mariachi')).toMatchObject({ ja: 'セニョールけけ', en: 'K.K. Mariachi' }); // e+'s Señor K.K.
    expect(Object.keys(AUDIO.kkAircheck).every((id) => kkTracks.some((k) => k.id === id))).toBe(true);
    for (const k of kkTracks) {
      expect(k.file).toBe(`kk/${k.id}.m4a`);
      expect(k.start).toBe(0);
      expect(k.end).toBeUndefined(); // one-shots: he plays a song once
    }
  });
  it('picks any song but the last one', () => {
    const t = kkTracks.slice(0, 3);
    expect(kkPick(() => 0, null, t)?.id).toBe('kk-chorale');
    expect(kkPick(() => 0, 'kk-chorale', t)?.id).toBe('kk-march');
    expect(kkPick(() => 0.99, 'kk-waltz', t)?.id).toBe('kk-march');
    expect(kkPick(() => 0.5, 'kk-march', t.slice(1, 2))?.id).toBe('kk-march'); // the only one
    expect(kkPick(() => 0.5, null, [])).toBeNull();
  });
});
