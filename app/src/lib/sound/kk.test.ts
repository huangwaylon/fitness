// K.K.'s song list (docs/design.md#kk-slider): static/audio/kk.json, its own chunk (kk.ts loadKK).
import { describe, expect, it } from 'vitest';
import raw from '../../../static/audio/kk.json';
import { i18n } from '#lib/i18n/index.ts';
import { kkLoaded, kkPick, kkTitle, kkTrack, loadKK, parseKK } from './kk.ts';

describe('K.K. songs (kk.ts)', () => {
  it('the list: NH’s official titles, one file each under kk/, in the song-list order', () => {
    const { list: { tracks: kkTracks, airchecks }, problems } = parseKK(raw);
    expect(problems).toEqual([]);
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
    expect(Object.keys(airchecks).every((id) => kkTracks.some((k) => k.id === id))).toBe(true);
    for (const k of kkTracks) {
      expect(k.file).toMatch(new RegExp(`^kk/${k.id}\\.m4a\\?v=`));
      expect(k.start).toBe(0);
      expect(k.end).toBeUndefined(); // one-shots: he plays a song once
    }
  });
  it('picks any song but the last one', () => {
    const t = parseKK(raw).list.tracks.slice(0, 3);
    expect(kkPick(() => 0, null, t)?.id).toBe('kk-chorale');
    expect(kkPick(() => 0, 'kk-chorale', t)?.id).toBe('kk-march');
    expect(kkPick(() => 0.99, 'kk-waltz', t)?.id).toBe('kk-march');
    expect(kkPick(() => 0.5, 'kk-march', t.slice(1, 2))?.id).toBe('kk-march'); // the only one
    expect(kkPick(() => 0.5, null, [])).toBeNull();
  });
  it('loads once, as its own chunk; a song plays its aircheck from a stereo, else its live file', async () => {
    expect(kkLoaded()).toBeNull();
    const a = loadKK();
    expect(loadKK()).toBe(a);
    const list = await a;
    expect(kkLoaded()).toBe(list);
    expect(kkTrack('kk-march', 'aircheck')?.track.file).toMatch(/^kk\/aircheck\/kk-march\.m4a\?v=/);
    expect(kkTrack('kk-march', 'live')?.track.file).toMatch(/^kk\/kk-march\.m4a\?v=/);
    expect(kkTrack('kk-wandering', 'aircheck')?.track.file).toMatch(/^kk\/kk-wandering\.m4a/); // e+'s: none
    expect(kkTrack('nope', 'live')).toBeNull();
    expect(kkTitle({ ja: 'けけマーチ', en: 'K.K. March' })).toBe(i18n.locale === 'en' ? 'K.K. March' : 'けけマーチ');
  });
  it('drops what it cannot use and says so', () => {
    expect(parseKK({
      kk: [{ id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/a.m4a', start: 5, v: '0a1b2c3d' }, { id: 'kk-b', file: 'kk/b.m4a' }, { id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/a2.m4a' }],
      kkAircheck: { 'kk-a': { file: 'kk/aircheck/kk-a.m4a', start: 3, gain: -1 }, 'kk-b': 'kk/b.m4a' }
    })).toEqual({
      // (one-shots: from their start)
      list: { tracks: [{ id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/a.m4a?v=0a1b2c3d', start: 0 }], airchecks: { 'kk-a': { file: 'kk/aircheck/kk-a.m4a', start: 0, gain: -1 } } },
      problems: ['kk.1', 'kk.2', 'kkAircheck.kk-b']
    });
    expect(parseKK(null)).toEqual({ list: { tracks: [], airchecks: {} }, problems: [] });
  });
});
