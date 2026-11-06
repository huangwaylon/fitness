import { describe, expect, it } from 'vitest';
import { addMode, contentLevels, lvForMode, lvOfPlace, modeOf, placeOfLv, playable, sharable, shelves, whims } from './catalog.ts';

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
  it('shares the playable modes that can be played together (not おさらい, nor the tournament: its own lobby)', () => {
    expect(sharable(ALL).map((m) => m.id)).toEqual(['quiz', 'ladder', 'announce']);
    expect(sharable({ ...ALL, taikai: true }).map((m) => m.id)).toEqual(['quiz', 'ladder', 'announce']);
  });
  it('しずえの しゅうまつ たいかい: on no shelf, playable only on its weekend (and with a quiz level)', () => {
    expect(playable('taikai', ALL)).toBe(false);
    expect(playable('taikai', { ...ALL, taikai: true })).toBe(true);
    expect(playable('taikai', { ...ALL, levels: [5], taikai: true })).toBe(false);
    expect(shelves({ ...ALL, taikai: true }).flatMap((s) => s.modes.map((m) => m.id))).not.toContain('taikai');
  });
});

describe('the later games’ modes', () => {
  const lanes = (...gms: string[]) => ({ ...ALL, games: (gm: string) => gms.includes(gm) });
  it('wave 2’s are on their shelves once this build can play their game (its lane and listened content)', () => {
    expect(shelves(ALL).flatMap((s) => s.modes.map((m) => m.id))).not.toContain('tile');
    expect(shelves(lanes('tile', 'rush', 'call', 'tachi', 'news')).map((s) => [s.group, s.modes.map((m) => m.id)])).toEqual([
      ['quick', ['quiz', 'ladder', 'review', 'tile', 'rush']],
      ['scene', ['announce', 'call', 'tachi']],
      ['long', ['news']],
      ['night', ['story']]
    ]);
    expect(sharable(lanes('tile', 'news')).map((m) => m.id)).toEqual(['quiz', 'ladder', 'tile', 'announce', 'news']);
    expect(whims(lanes('call')).sort()).toEqual(['announce', 'call', 'ladder', 'quiz']);
    expect([modeOf('tile').icon, modeOf('news').places, modeOf('call').places]).toEqual(['🧩', undefined, true]);
  });
  it('a mode from a registry line (a mic mode): on 声に出す, last, while its gate is open; never きまぐれ’s', () => {
    let on = false;
    addMode({ id: 'mane-t', group: 'koe', icon: '🦜', mins: 3, qs: 4, coop: false, game: 'mane-t', requires: 'mic', gate: () => on });
    expect(() => addMode({ ...modeOf('mane-t') })).toThrow();
    const c = lanes('mane-t');
    expect(shelves(c).map((s) => s.group)).toEqual(['quick', 'scene', 'night']);
    on = true;
    expect(shelves(c).map((s) => s.group)).toEqual(['quick', 'scene', 'night', 'koe']);
    expect(playable('mane-t', { ...c, games: () => false })).toBe(false);
    expect(whims(c)).not.toContain('mane-t');
    expect(modeOf('mane-t').requires).toBe('mic');
  });
  it('a lane’s game’s places: its listened files’ stages, each place’s first level', () => {
    const listen = { 's1-tile-a': ['tile', 2, 'listened'], 's3-tile': ['tile', 4, 'listened'], 's0-tile': ['tile', 1, 'listened'], 's2-tile': ['tile', 3, 'draft'], 's2-call': ['call', 3, 'listened'] } as const;
    expect(contentLevels('tile', listen)).toEqual([1, 3, 6]);
    expect(contentLevels('call', listen)).toEqual([4]);
    expect(contentLevels('news', listen)).toEqual([]);
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
