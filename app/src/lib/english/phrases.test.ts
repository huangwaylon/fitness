import { describe, expect, it } from 'vitest';
import { momentsOf } from './phrases.ts';
import { fixture } from './fixture.ts';
import type { Clip } from './types.ts';

const notes = { said: 's', mean: 'm', trap: 't', use: 'u（u）', cue: 'c', stem: 'q?', choices: ['a', 'b', 'c'], a: 0 };
const clip: Clip = {
  ...fixture,
  questions: [
    { id: 'g1', skill: 'gist', level: 'B1', point: 'p1', seg: [0, 60], ...notes },
    { id: 'd2', skill: 'detail', level: 'B1', point: 'p2', seg: [30, 34], line: 'Later *on*.', ...notes },
    { id: 'd1', skill: 'detail', level: 'B1', point: 'p3', seg: [12, 15], line: 'First *one*.', ...notes },
    { id: 'r1', skill: 'infer', level: 'C2', point: 'p4', seg: [12.5, 18], line: 'Same *moment*.', retired: true, ...notes },
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'p5', seg: [20, 22], line: 'first ONE', ...notes }
  ]
};

describe('momentsOf (この動画のフレーズ)', () => {
  it('every quoted line once (the retired too, none for a scene gist), in time order, a moment’s lines together', () => {
    const m = momentsOf(clip);
    expect(m.map((x) => x.qs.map((q) => q.id))).toEqual([['d1', 'r1'], ['d2']]);
    expect(m.map((x) => [x.from, x.to])).toEqual([[12, 18], [30, 34]]);
  });
  it('the same words once, whatever the stars and the punctuation', () => {
    expect(momentsOf(fixture).map((x) => x.qs.map((q) => q.id))).toEqual([['g1'], ['x1']]);
  });
});
