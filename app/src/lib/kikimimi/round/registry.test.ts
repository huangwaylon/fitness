// The games' registry (round/registry.ts): the built-in lanes at once, a later game's lane by import() only when asked
// (once, a failed one tried again), its mode shown only with its content `listened`.
import { describe, expect, it } from 'vitest';
import type { ListenEntry } from '../listen.ts';
import { listenOf, load } from '../pool.ts';
import { LANES, Registry, laneOpts, levelFor, type Lane } from './registry.ts';

const fake = (id: string): Lane => ({ id, def: () => ({ id, modes: { solo: true, coop: false, vs: false, same: false }, opts: { encode: () => [], decode: () => ({}) }, deck: () => ({ count: 0, round: () => undefined, timing: () => ({ lead: 0, play: 0, answer: 0 }), valid: () => false, grade: () => ({ ok: false, pts: 0 }), maxScore: 0 }) }), chunks: () => [], deal: () => [] });

describe('the registry', () => {
  it('has the games built into the sheet at once, each one’s lane under its id', () => {
    for (const gm of ['quiz', 'ladder', 'lesson', 'taikai', 'check']) expect(LANES.of(gm)?.id).toBe(gm);
    expect(LANES.of('nope')).toBeUndefined();
    expect(LANES.loading('quiz')).toBeNull(); // (nothing to wait for)
    expect(LANES.loading('nope')).toBeNull(); // (a game this build hasn't: the session blocks its open)
  });

  it('loads a later game’s lane only when asked, once (and again after a failure)', async () => {
    let calls = 0, fail = true;
    const r = new Registry([], {
      tile: { lane: () => (calls++, fail ? Promise.reject(new Error('offline')) : Promise.resolve({ lane: fake('tile') })) }
    }, {});
    expect(r.of('tile')).toBeUndefined();
    expect(calls).toBe(0);
    await expect(r.loading('tile')).rejects.toThrow('offline');
    fail = false;
    const p = r.loading('tile');
    expect(r.loading('tile')).toBe(p);
    expect((await p)?.id).toBe('tile');
    expect(r.of('tile')?.id).toBe('tile');
    expect(r.loading('tile')).toBeNull();
    expect(calls).toBe(2);
  });

  it('a later game is ready once its lane is registered and a file of its is listened (or its own content says so)', () => {
    const lane = () => Promise.resolve({ lane: fake('x') });
    const r = new Registry([], { tile: { lane }, call: { lane }, mane: { lane, content: () => true } }, {
      's1-tile-a': ['tile', 2, 'listened'], 's1-call': ['call', 2, 'voiced'], 's2-tachi-a': ['tachi', 3, 'listened']
    });
    expect(['tile', 'call', 'tachi', 'mane', 'quiz'].map((gm) => r.ready(gm))).toEqual([true, false, false, true, false]);
    // this build: ことば タイル's, ようじ でんわ's and たちぎき's files listened (A1); すうじ ラッシュ's and ニュース's still drafts
    expect(['tile', 'call', 'tachi', 'rush', 'news'].map((gm) => LANES.ready(gm))).toEqual([true, true, true, false, false]);
  });

  it('a lane’s game plays at a place its listened files have, its options the quiz’s by default', () => {
    const listen: Record<string, ListenEntry> = { 's1-tile-a': ['tile', 2, 'listened'], 's3-tile': ['tile', 4, 'listened'], 's2-tile': ['tile', 3, 'draft'] };
    expect([1, 3, 4, 6].map((lv) => levelFor('tile', lv, listen))).toEqual([3, 3, 3, 6]);
    expect(levelFor('call', 4, listen)).toBe(4);
    expect(laneOpts(fake('tile'), { lv: 3, timer: 20 })).toEqual([3, 1]);
    expect(laneOpts({ ...fake('tile'), opts: (p) => [p.lv, 0, 7] }, { lv: 3, timer: 20 })).toEqual([3, 0, 7]);
  });

  it('a lane deals from its listening file’s part once it’s loaded (pool.ts listenOf)', async () => {
    expect(listenOf('s1-tile-a')).toBeUndefined();
    await load('s1-tile-a');
    expect(listenOf('s1-tile-a')).toMatchObject({ unit: 's1-tile-a', game: 'tile' });
    expect(listenOf('s1-tile-a')!.items.length).toBeGreaterThan(0);
    expect(listenOf('1')).toBeUndefined(); // (a level's chunk isn't one)
  });
});
