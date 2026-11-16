// The draw (draw.ts) over a made-up bank of 20: the size by length, the gist first then clip order, the quotas (play 1
// L2 I2 F1; play 2+ L1 I3 F1 with a C1), unseen and new points first, ≤ 1 dict, points and reveals, a predict's
// continuation, the same draw for the same seed; the history from listen rows; the choices' order.
import { describe, expect, it } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { choiceOrder, draw, drawSize, GROUP_OF, historyOf, seedOf, type History } from './draw.ts';
import type { Clip, Question, Skill } from './types.ts';

let t = 0;
const q = (id: string, skill: Skill, level: Question['level'] = 'B2', extra: Partial<Question> = {}): Question => {
  t += 3;
  return { id, skill, level, point: id, seg: [t, t + (skill === 'gist' ? 20 : 4)], stem: `Q ${id}?`, choices: ['a', 'b', 'c'], a: 0, line: 'x', cue: 'c', said: 's', mean: 'm', trap: 't', use: 'u（u）', ...extra };
};
const bank: Question[] = [
  q('g1', 'gist', 'B1', { reveals: ['n1'] }), q('g2', 'gist', 'B1'),
  q('d1', 'detail', 'B1'), q('d2', 'detail', 'B1'), q('n1', 'number', 'B1'), q('w1', 'who', 'B2'),
  q('i1', 'infer', 'B2'), q('i2', 'infer', 'C1', { point: 'pt' }), q('t1', 'attitude', 'B2'), q('t2', 'attitude', 'C1'), q('r1', 'pragma', 'B2', { point: 'pt' }),
  q('h1', 'humor', 'C1'), q('h2', 'humor', 'C1'), q('k1', 'predict', 'B2'),
  q('m1', 'marker', 'B2'), q('p1', 'phrase', 'B2'), q('s1', 'sound', 'B2'), q('x1', 'dict', 'B2', { choices: undefined, a: undefined, answer: 'x' }), q('x2', 'dict', 'C1', { choices: undefined, a: undefined, answer: 'y' }),
  q('p2', 'phrase', 'C1')
];
const clip: Clip = { id: 'test', video: 'abcdefghijk', title: 'T', dur: 68, wpm: 120, band: 'mid', tags: [], credit: 'c', questions: bank };
const groups = (d: Question[]) => d.slice(1).reduce((m, x) => ({ ...m, [GROUP_OF[x.skill]]: (m[GROUP_OF[x.skill]] ?? 0) + 1 }), {} as Record<string, number>);

describe('draw', () => {
  it('6 under 90 s, 7 under 180 s, else 8', () => {
    expect([drawSize(68), drawSize(90), drawSize(179), drawSize(180)]).toEqual([6, 7, 7, 8]);
  });
  it('play 1: an unseen gist first (the fewest reveals), then L2 I2 F1 in clip order, at most 2 C1', () => {
    for (let s = 0; s < 30; s++) {
      const d = draw(clip, {}, 1, `A:test:1:${s}`);
      expect(d).toHaveLength(6);
      expect(d[0].id).toBe('g2');
      expect(groups(d)).toEqual({ L: 2, I: 2, F: 1 });
      expect(d.slice(1).map((x) => x.seg[0])).toEqual(d.slice(1).map((x) => x.seg[0]).sort((a, b) => a - b));
      expect(d.filter((x) => x.level === 'C1').length).toBeLessThanOrEqual(2);
    }
  });
  it('play 2: the other gist, L1 I3 F1, a C1, the unseen first', () => {
    const one = draw(clip, {}, 1, 's');
    const seen: History = Object.fromEntries(one.map((x) => [x.id, { play: 1, ok: true }]));
    const two = draw(clip, seen, 2, 's2');
    expect(two[0].id).toBe('g1');
    expect(groups(two)).toEqual({ L: 1, I: 3, F: 1 });
    expect(two.some((x) => x.level === 'C1')).toBe(true);
    expect(two.slice(1).filter((x) => one.includes(x))).toEqual([]);
  });
  it('never two on a point, nor one revealing another; ≤ 1 dict, humor, predict', () => {
    for (let s = 0; s < 50; s++)
      for (const play of [1, 2, 3]) {
        const d = draw(clip, {}, play, String(s));
        expect(new Set(d.map((x) => x.point)).size).toBe(d.length);
        expect(d.some((x) => x.id === 'g1') && d.some((x) => x.id === 'n1')).toBe(false);
        for (const sk of ['dict', 'humor', 'predict']) expect(d.filter((x) => x.skill === sk).length).toBeLessThanOrEqual(1);
      }
  });
  it('a predict never after an item whose segment holds its continuation', () => {
    const k = q('k9', 'predict', 'B2', { seg: [40, 44], then: [44, 50] });
    const cover = q('d9', 'detail', 'B1', { seg: [30, 52] });
    const c2: Clip = { ...clip, questions: [q('g9', 'gist', 'B1'), cover, k, ...bank.filter((x) => !['predict', 'detail', 'gist'].includes(x.skill))] };
    for (let s = 0; s < 40; s++) {
      const d = draw(c2, {}, 2, String(s));
      expect(d.includes(k) && d.includes(cover)).toBe(false);
    }
  });
  it('the same seed, the same draw; a lesson smaller than the size: all of it', () => {
    expect(draw(clip, {}, 1, 'x').map((x) => x.id)).toEqual(draw(clip, {}, 1, 'x').map((x) => x.id));
    const small: Clip = { ...clip, questions: bank.slice(0, 4) };
    expect(draw(small, {}, 1, 'x').map((x) => x.id)).toEqual(['g2', 'g1', 'd1', 'd2']);
  });
});

describe('historyOf', () => {
  it('my rows for the clip: each item’s last play and first-try result; a part-way row is its play’s', () => {
    const row = (who: 'A' | 'B', data: object): EventRow => ['', who, 'e', 'listen', JSON.stringify({ d: '2026-11-16', g: 'tvabcd', gm: 'tv', u: 'test', lv: 7, n: 1, ms: 1, r: [], ...data })];
    const rows = [row('A', { f: 1, r: [['g2', 1, 0, 0], ['d1', 0, 1, 1]] }), row('A', { r: [['g1', 1, 0, 0]] }), row('B', { f: 1, r: [['d2', 1, 0, 0]] }), row('A', { u: 'other', f: 1, r: [['p1', 1, 0, 0]] })];
    expect(historyOf(rows, 'A', 'test')).toEqual({ plays: 1, seen: { g2: { play: 1, ok: true }, d1: { play: 1, ok: false }, g1: { play: 2, ok: true } } });
  });
});

describe('choiceOrder', () => {
  it('shuffled per player and item, the same each time; `keep` as authored', () => {
    const many = q('z1', 'detail', 'B1', { choices: ['a', 'b', 'c', 'd'] });
    const o = choiceOrder(many, seedOf('A', 'test', 1));
    expect([...o].sort()).toEqual([0, 1, 2, 3]);
    expect(choiceOrder(many, seedOf('A', 'test', 1))).toEqual(o);
    expect(new Set(Array.from({ length: 12 }, (_, i) => choiceOrder(many, `s${i}`).join())).size).toBeGreaterThan(1);
    expect(choiceOrder({ ...many, keep: true }, 'x')).toEqual([0, 1, 2, 3]);
  });
});
