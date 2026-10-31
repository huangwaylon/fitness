// Event music by Tokyo date and hour (docs/design.md#event-music), and K.K.'s song list (#kk-slider).
import { describe, expect, it } from 'vitest';
import { EVENT_MUSIC_IDS, eventMusicAt, fourthThursday } from './events.ts';
import { kkPick, kkTracks } from './kk.ts';
import { AUDIO } from './manifest.ts';

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
    expect([2026, 2027, 2028, 2029, 2030].map(fourthThursday)).toEqual([26, 25, 23, 22, 28]);
    for (const y of [2026, 2027, 2028, 2029, 2030]) {
      const d = new Date(Date.UTC(y, 10, fourthThursday(y)));
      expect(d.getUTCDay()).toBe(4);
      expect(d.getUTCDate()).toBeGreaterThan(21);
      expect(d.getUTCDate()).toBeLessThanOrEqual(28);
    }
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
  it('New Year: no countdown track on Dec 31 (the 23:00 hour plays), Happy New Year! at midnight, then the fireworks', () => {
    expect(at('2026-12-31T23:59:59')).toBeNull();
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
  it('an ordinary day has none', () => {
    for (const s of ['2026-07-15T12:00:00', '2026-12-25T20:00:00', '2027-02-01T00:30:00']) expect(at(s)).toBeNull();
  });
  it('every event track is in the manifest', () => {
    expect(Object.keys(AUDIO.events).sort()).toEqual([...EVENT_MUSIC_IDS].sort());
    // the loops carry a period end (the deck hand-off); the jingle and the sting are one-shots
    for (const id of EVENT_MUSIC_IDS) {
      const t = AUDIO.events[id]!;
      if (id === 'happy-new-year' || id === 'bee-stung') expect(t).toMatchObject({ start: 0 });
      else expect(t.end).toBeGreaterThan(t.start);
      expect(t.gain).toBeGreaterThanOrEqual(-12);
      expect(t.gain).toBeLessThanOrEqual(6);
    }
  });
});

describe('K.K. songs (kk.ts)', () => {
  it('the list: NH’s official titles, one file each under kk/, in the song-list order', () => {
    expect(kkTracks.map((k) => [k.id, k.ja, k.en])).toEqual([
      ['kk-chorale', 'けけさんびか', 'K.K. Chorale'],
      ['kk-march', 'けけマーチ', 'K.K. March'],
      ['kk-waltz', 'けけワルツ', 'K.K. Waltz'],
      ['kk-swing', 'けけスウィング', 'K.K. Swing'],
      ['kk-bossa', 'けけボッサ', 'K.K. Bossa'],
      ['kk-salsa', 'けけサルサ', 'K.K. Salsa'],
      ['kk-reggae', 'けけレゲエ', 'K.K. Reggae'],
      ['kk-rock', 'けけロック', 'K.K. Rock'],
      ['kk-rockin', 'けけのロケンロール', "Rockin' K.K."]
    ]);
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
