import { describe, expect, it } from 'vitest';
import { searchKey } from './text.ts';

describe('searchKey: the long vowel', () => {
  it('keeps ー, so カレー is not かれい (the fish) and サワー not さわら', () => {
    expect(searchKey('カレー')).toBe('かれー');
    expect(searchKey('カレー')).not.toBe(searchKey('かれい'));
    expect(searchKey('サワー')).not.toBe(searchKey('さわら'));
    expect(searchKey('ラーメン')).toBe(searchKey('らーめん'));
  });
  it('reads ｰ, －, ‐, −, 〜 and ～ after kana as ー', () => {
    for (const v of ['ｶﾚｰ', 'カレ－', 'カレ‐', 'カレ−', 'カレ〜', 'カレ～', 'かれ-']) expect(searchKey(v)).toBe('かれー');
  });
  it('still drops a dash or a wave elsewhere (between digits, latin)', () => {
    expect(searchKey('8-12')).toBe('812');
    expect(searchKey('T-shirt')).toBe('tsirt');
  });
});
