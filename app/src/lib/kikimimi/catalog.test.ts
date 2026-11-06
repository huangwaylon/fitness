import { describe, expect, it } from 'vitest';
import { lvForMode, lvOfPlace, placeOfLv, playable, sharable, shelves } from './catalog.ts';

const ALL = { levels: [1, 2, 3, 4, 5, 6, 7], ladder: true, review: true, story: true };

describe('the modes', () => {
  it('shows only what this build can play, grouped by situation, empty groups hidden', () => {
    expect(shelves(ALL).map((s) => [s.group, s.modes.map((m) => m.id)])).toEqual([
      ['quick', ['quiz', 'ladder', 'review']],
      ['scene', ['announce']],
      ['night', ['story']]
    ]);
    expect(shelves({ levels: [1, 2], ladder: false, review: false }).map((s) => [s.group, s.modes.map((m) => m.id)])).toEqual([['quick', ['quiz']]]);
  });
  it('アナウンス needs level 5, the quiz another level, おさらい a game played', () => {
    expect(playable('announce', { ...ALL, levels: [1, 2] })).toBe(false);
    expect(playable('quiz', { ...ALL, levels: [5] })).toBe(false);
    expect(playable('review', { ...ALL, review: false })).toBe(false);
    expect(playable('story', { ...ALL, story: false })).toBe(false); // (no voiced serial)
  });
  it('shares the playable modes that can be played together (not おさらい)', () => {
    expect(sharable(ALL).map((m) => m.id)).toEqual(['quiz', 'ladder', 'announce']);
  });
});

describe('ばしょ', () => {
  it('maps the levels onto the places (はまべ two sub-steps, 5 none)', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(placeOfLv)).toEqual(['hama', 'hama', 'kawa', 'mori', null, 'yama', 'hoshi']);
  });
  it('a place plays its first offered level, はまべ keeps its sub-step, a place without one is null', () => {
    expect(lvOfPlace('hama', ALL.levels)).toBe(1);
    expect(lvOfPlace('hama', ALL.levels, 2)).toBe(2);
    expect(lvOfPlace('mori', ALL.levels, 2)).toBe(4);
    expect(lvOfPlace('yama', [1, 2, 3, 4])).toBeNull();
  });
  it('a mode opens at its level: アナウンス 5, the quiz the last one unless that was 5', () => {
    expect(lvForMode('announce', 3)).toBe(5);
    expect(lvForMode('quiz', 3)).toBe(3);
    expect(lvForMode('quiz', 5)).toBe(1);
  });
});
