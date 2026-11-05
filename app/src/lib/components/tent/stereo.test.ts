// The rooms' music players (tent/stereo.ts) and the aircheck they play (sound/kk.ts kkFile).
import { describe, expect, test } from 'vitest';
import { ITEMS } from './items.ts';
import { MUSIC_PLAYERS, isStereo, stereoTap } from './stereo.ts';
import { kkFile, type KKTrack } from '#lib/sound/kk.ts';

describe('the music players', () => {
  test('the stereos, the jukebox and the record players play; a lamp, a chair, an unknown code don’t', () => {
    const code = (cat: string) => Object.keys(ITEMS).find((c) => ITEMS[c].cat === cat)!;
    for (const cat of ['hi-fi-stereo', 'jukebox', 'high-end-stereo', 'retro-stereo', 'phonograph']) expect(isStereo(code(cat)), cat).toBe(true);
    expect(isStereo(code('rock-guitar'))).toBe(false);
    expect(isStereo(Object.keys(ITEMS).find((c) => ITEMS[c].lt)!)).toBe(false);
    expect(isStereo('nope')).toBe(false);
  });
  test('every one of them is a piece the rooms have', () => {
    const cats = new Set(Object.values(ITEMS).map((m) => m.cat));
    for (const c of MUSIC_PLAYERS) expect(cats.has(c), c).toBe(true);
  });
  test('a tap on the one playing stops it; on another, or once its song is over, the song list', () => {
    expect(stereoTap('o1', 'o1', true)).toBe('stop');
    expect(stereoTap('o2', 'o1', true)).toBe('pick');
    expect(stereoTap('o1', 'o1', false)).toBe('pick');
    expect(stereoTap('o1', null, false)).toBe('pick');
  });
});

describe('the aircheck', () => {
  const song: KKTrack = { id: 'kk-a', ja: 'あ', en: 'A', file: 'kk/kk-a.m4a', start: 0, gain: -2 };
  test('a stereo plays the song’s aircheck; K.K. his live file', () => {
    const air = { 'kk-a': { file: 'kk/aircheck/kk-a.m4a', start: 0, gain: -1 } };
    expect(kkFile(song, 'aircheck', air).file).toBe('kk/aircheck/kk-a.m4a');
    expect(kkFile(song, 'live', air)).toBe(song);
  });
  test('a song with no aircheck yet: the stereo plays the live file', () => {
    expect(kkFile(song, 'aircheck', {})).toBe(song);
  });
});
