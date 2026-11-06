// What the music plays (sound/choose.ts, docs/design.md#sound): the island's own at a moment, a room's, the order they
// win in, what stays fetched, the label.
import { describe, expect, it } from 'vitest';
import { musicAt, openingMusic, pickMusic, pinsFor, placeMusic, playingLabel, type CutIn } from './choose.ts';
import type { MusicTrack } from './hourly.ts';
import { i18n } from '#lib/i18n/index.ts';

const T = (file: string, end?: number): MusicTrack => ({ file, start: 0, ...(end ? { end } : {}) });
const FILES = {
  opening: T('music/opening.m4a'),
  music: { sunny: { '10': T('music/hour-10.m4a', 60), '00': T('music/hour-00.m4a', 60) }, rain: { '10': T('music/rain-10.m4a', 60) } },
  events: {
    halloween: T('music/halloween.m4a', 60),
    'happy-new-year': T('music/happy-new-year.m4a'),
    'new-year-0am': T('music/new-year-0am.m4a', 60),
    'bee-stung': T('music/bee-stung.m4a'),
    'turkey-cooking-done': T('music/turkey-cooking-done.m4a')
  },
  places: { shop: T('places/shop.m4a', 60) }
};
const at = (s: string) => new Date(`${s}+09:00`);
const never = () => false;

describe('musicAt: the island’s own', () => {
  it('the Tokyo hour’s in the weather (else the sunny one)', () => {
    expect(musicAt(at('2026-11-05T10:20:00'), 'rain', FILES, never)).toMatchObject({ key: 'rain/10', playing: 'hour', loop: true });
    expect(musicAt(at('2026-11-05T10:20:00'), 'snow', FILES, never)?.key).toBe('sunny/10');
    expect(musicAt(at('2026-11-05T11:00:00'), 'sunny', FILES, never)).toBeNull(); // no file: silence, never another hour
  });
  it('an event’s on its day; the midnight intro once, unless heard that day', () => {
    expect(musicAt(at('2026-10-31T20:00:00'), 'sunny', FILES, never)).toMatchObject({ key: 'event/halloween', loop: true });
    const midnight = at('2027-01-01T00:00:30');
    expect(musicAt(midnight, 'sunny', FILES, never)).toMatchObject({ key: 'event/happy-new-year', loop: false });
    expect(musicAt(midnight, 'sunny', FILES, (day) => day === '2027-01-01')?.key).toBe('event/new-year-0am');
  });
});

describe('pickMusic: opening > cut-in > stage > place > island (event, else hour)', () => {
  it('the shared stage under my own cut-in and the opening, over the room and the island', () => {
    expect(pickMusic({ opening: 'o', cutIn: 'wasps', stage: 'kk', place: 'shop', island: 'hour' })).toBe('o');
    expect(pickMusic({ cutIn: 'wasps', stage: 'kk', place: 'shop', island: 'hour' })).toBe('wasps');
    expect(pickMusic({ stage: 'stereo', place: 'shop', island: 'hour' })).toBe('stereo');
    expect(pickMusic({ stage: null, place: 'shop', island: 'hour' })).toBe('shop');
  });
  it('the first there wins', () => {
    expect(pickMusic({ opening: 'o', cutIn: 'kk', place: 'shop', island: 'hour' })).toBe('o');
    expect(pickMusic({ cutIn: 'kk', place: 'shop', island: 'halloween' })).toBe('kk');
    expect(pickMusic({ cutIn: null, place: 'shop', island: 'halloween' })).toBe('shop'); // indoors on an event day
    expect(pickMusic({ place: null, island: 'halloween' })).toBe('halloween'); // a room without a file
    expect(pickMusic({})).toBeNull();
  });
  it('a room’s track and the opening as tracks to play', () => {
    expect(placeMusic('shop', FILES)).toMatchObject({ key: 'place/shop', playing: 'shop', loop: true });
    expect(placeMusic('museum-hall', FILES)).toBeNull();
    expect(placeMusic(null, FILES)).toBeNull();
    expect(openingMusic(FILES)).toMatchObject({ key: 'opening', loop: false });
    expect(openingMusic({ ...FILES, opening: null })).toBeNull();
  });
});

describe('pinsFor: what stays fetched under a change', () => {
  const island = musicAt(at('2026-11-05T10:20:00'), 'sunny', FILES, never);
  const shop = placeMusic('shop', FILES);
  const cut = (o: Partial<CutIn>): CutIn => ({ key: 'event/x', track: T('music/x.m4a'), playing: 'kk', loop: false, ...o });
  it('indoors the island’s track; outdoors nothing', () => {
    expect(pinsFor({ cutIn: null, place: shop, island, files: FILES })).toEqual(['music/hour-10.m4a']);
    expect(pinsFor({ cutIn: null, place: null, island, files: FILES })).toEqual([]);
  });
  it('under a cut-in: the room’s and the island’s, its chain’s next, and the sting that may follow the chase', () => {
    expect(pinsFor({ cutIn: cut({ id: 'happy-birthday' }), place: shop, island, files: FILES })).toEqual(['places/shop.m4a', 'music/hour-10.m4a']);
    expect(pinsFor({ cutIn: cut({ id: 'turkey-cooking-start', next: ['turkey-cooking-done'] }), place: null, island, files: FILES }))
      .toEqual(['music/hour-10.m4a', 'music/turkey-cooking-done.m4a']);
    expect(pinsFor({ cutIn: cut({ id: 'bee-chase' }), place: null, island, files: FILES })).toEqual(['music/hour-10.m4a', 'music/bee-stung.m4a']);
  });
});

describe('playingLabel', () => {
  it('names the opening, the hour, an event’s track, and a K.K. song from the cut-in (an aircheck as one)', () => {
    const ja = i18n.locale !== 'en';
    expect(playingLabel('hour', 10, null)).toBeTruthy();
    expect(playingLabel('opening', 10, null)).toBeTruthy();
    expect(playingLabel('halloween', 20, null)).toContain(ja ? 'ハロウィン' : 'Halloween');
    const song = { id: 'kk-march', ja: 'けけマーチ', en: 'K.K. March', file: 'kk/kk-march.m4a', start: 0 };
    const live = playingLabel('kk', 20, { song, aircheck: false });
    const air = playingLabel('kk', 20, { song, aircheck: true });
    expect(live).toContain(ja ? 'けけマーチ' : 'K.K. March');
    expect(air).toContain(ja ? 'けけマーチ' : 'K.K. March');
    expect(air).not.toBe(live);
    expect(playingLabel('kk', 20, null)).toBeNull();
    expect(playingLabel(null, 20, null)).toBeNull();
  });
});
