// The draw (draw.ts) over a made-up bank of 20: the size by length, clip order (the gist too), the quotas (play
// 1 L2 I1 F2; play 2+ L2 I2 F1), ≤ 2 of a skill, ≤ 1 C1 a play, C2 only when harder, the unseen before any repeat, new points first,
// ≤ 1 dict, points and reveals, a predict's continuation, spread over the clip, a context item, a set-up gist and
// one a play, an easy opening, the same draw for the same seed; the history from listen rows; the choices' order.
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
const clip: Clip = { id: 'test', video: 'abcdefghijk', title: 'T', dur: 68, wpm: 120, band: 'mid', tags: [], show: 'Friends', credit: 'c', questions: bank };
const groups = (d: Question[]) => d.filter((x) => x.skill !== 'gist').reduce((m, x) => ({ ...m, [GROUP_OF[x.skill]]: (m[GROUP_OF[x.skill]] ?? 0) + 1 }), {} as Record<string, number>);

describe('draw', () => {
  it('6 under 90 s, 7 under 180 s, else 8', () => {
    expect([drawSize(68), drawSize(90), drawSize(179), drawSize(180)]).toEqual([6, 7, 7, 8]);
  });
  it('play 1: an unseen gist (the fewest reveals), L2 I1 F2, all in clip order, at most 1 C1', () => {
    for (let s = 0; s < 30; s++) {
      const d = draw(clip, {}, 1, `A:test:1:${s}`);
      expect(d).toHaveLength(6);
      expect(d.filter((x) => x.skill === 'gist').map((x) => x.id)).toEqual(['g2']);
      expect(groups(d)).toEqual({ L: 2, I: 1, F: 2 });
      expect(d.slice(1).map((x) => x.seg[0])).toEqual(d.slice(1).map((x) => x.seg[0]).sort((a, b) => a - b));
      expect(GROUP_OF[d[0].skill] === 'L' || d[0].seg[0] === Math.min(...d.map((x) => x.seg[0]))).toBe(true);
      expect(d.filter((x) => x.level === 'C1').length).toBeLessThanOrEqual(1);
    }
  });
  it('play 2: the other gist, L2 I2 F1, the unseen first', () => {
    // a play 1 that took n1 (g1 reveals it), so two unseen L are left
    const one = ['g2', 'd1', 'n1', 'i1', 'm1', 'p1'];
    const seen: History = Object.fromEntries(one.map((id) => [id, { play: 1, ok: true }]));
    for (let s = 0; s < 30; s++) {
      const two = draw(clip, seen, 2, String(s));
      expect(two.filter((x) => x.skill === 'gist').map((x) => x.id)).toEqual(['g1']);
      expect(groups(two)).toEqual({ L: 2, I: 2, F: 1 });
      expect(two.slice(1).filter((x) => one.includes(x.id))).toEqual([]);
    }
  });
  it('≤ 1 C1 on every play; the unseen before any repeat', () => {
    for (let s = 0; s < 30; s++) for (const play of [1, 2, 3]) expect(draw(clip, {}, play, String(s)).filter((x) => x.level === 'C1').length).toBeLessThanOrEqual(1);
    // all but three non-gist items seen: those three are in, whatever the quotas say
    const fresh = ['d1', 'm1', 's1'];
    const most: History = Object.fromEntries(bank.filter((x) => x.skill !== 'gist' && !fresh.includes(x.id)).map((x) => [x.id, { play: 1, ok: true }]));
    for (let s = 0; s < 30; s++) expect(draw(clip, most, 2, String(s)).map((x) => x.id)).toEqual(expect.arrayContaining(fresh));
  });
  it('the native tier: never unless harder; then ≤ 1 a play, one while one is unseen', () => {
    const c2: Clip = { ...clip, questions: [...bank, q('z1', 'infer', 'C2'), q('z2', 'humor', 'C2'), q('z3', 'attitude', 'C2')] };
    const n2 = (d: Question[]) => d.filter((x) => x.level === 'C2').length;
    for (let s = 0; s < 30; s++) {
      const seen: History = {};
      for (const play of [1, 2, 3, 4]) {
        expect(n2(draw(c2, seen, play, String(s)))).toBe(0);
        const d = draw(c2, seen, play, String(s), { harder: true });
        if (play <= 3) expect(n2(d)).toBe(1); // z1–z3 unseen till then
        else expect(n2(d)).toBeLessThanOrEqual(1);
        for (const x of d) seen[x.id] = { play, ok: true };
      }
    }
  });
  it('never two on a point, nor one revealing another; ≤ 1 dict, humor, predict', () => {
    for (let s = 0; s < 50; s++)
      for (const play of [1, 2, 3]) {
        const d = draw(clip, {}, play, String(s));
        expect(new Set(d.map((x) => x.point)).size).toBe(d.length);
        expect(d.some((x) => x.id === 'g1') && d.some((x) => x.id === 'n1')).toBe(false);
        for (const sk of ['dict', 'humor', 'predict', 'pragma']) expect(d.filter((x) => x.skill === sk).length).toBeLessThanOrEqual(1);
      }
  });
  it('≤ 2 of a skill while another fits, past two only to fill', () => {
    // four details where the quotas want L: a number and the other groups first
    const c: Clip = { ...clip, questions: [q('g0', 'gist', 'B1'), ...['d1', 'd2', 'd3', 'd4'].map((id) => q(id, 'detail', 'B1')), q('n0', 'number', 'B1'), q('i0', 'infer', 'B2'), q('m0', 'marker', 'B2'), q('p0', 'phrase', 'B2')] };
    for (let s = 0; s < 30; s++)
      for (const play of [1, 2, 3]) expect(draw(c, {}, play, String(s)).filter((x) => x.skill === 'detail').length).toBeLessThanOrEqual(2);
    const only: Clip = { ...clip, questions: [q('g0', 'gist', 'B1'), ...['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map((id) => q(id, 'detail', 'B1'))] };
    expect(draw(only, {}, 1, 'x')).toHaveLength(6);
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
  it('spread over the clip: one scene gives at most one item, the rest across the clip', () => {
    const at = (id: string, skill: Skill, s0: number) => q(id, skill, 'B1', { seg: [s0, s0 + 4] });
    // five items across the speech span (0–104 s, 5 bins), a scene of six at 60–69 s
    const scene = [at('cd1', 'detail', 60), at('cd2', 'number', 61), at('cd3', 'who', 62), at('ci1', 'infer', 63), at('cm1', 'marker', 64), at('cm2', 'phrase', 65)];
    const far = [at('sd1', 'number', 2), at('sd2', 'detail', 20), at('sm1', 'marker', 40), at('sm2', 'phrase', 80), at('si1', 'infer', 100)];
    const c: Clip = { ...clip, questions: [q('g0', 'gist', 'B1', { seg: [0, 20] }), ...scene, ...far] };
    for (let s = 0; s < 30; s++) {
      const rest = draw(c, {}, 1, String(s)).filter((x) => x.skill !== 'gist');
      expect(groups(rest)).toEqual({ L: 2, I: 1, F: 2 });
      expect(rest.filter((x) => scene.includes(x)).length).toBeLessThanOrEqual(1);
    }
  });
  it('a context item in every play while one fits, though it costs more', () => {
    const c: Clip = { ...clip, questions: [...bank, q('cx', 'detail', 'C1', { ctx: true })] };
    for (let s = 0; s < 30; s++) expect(draw(c, {}, 1, String(s)).map((x) => x.id)).toContain('cx');
  });
  it('the gist a set-up one (starting in the first 40 %), one a play', () => {
    const c: Clip = { ...clip, questions: [q('ge', 'gist', 'B1', { seg: [40, 60] }), q('gs', 'gist', 'B1', { seg: [5, 25], reveals: ['d1', 'd2'] }), ...bank.filter((x) => x.skill !== 'gist')] };
    for (let s = 0; s < 30; s++) {
      const d = draw(c, {}, 1, String(s));
      expect(d.filter((x) => x.skill === 'gist').map((x) => x.id)).toEqual(['gs']);
    }
  });
  it('the same seed, the same draw; a lesson smaller than the size: all of it', () => {
    expect(draw(clip, {}, 1, 'x').map((x) => x.id)).toEqual(draw(clip, {}, 1, 'x').map((x) => x.id));
    const small: Clip = { ...clip, questions: bank.slice(0, 4) };
    expect(draw(small, {}, 1, 'x').map((x) => x.id)).toEqual(['d1', 'g1', 'g2', 'd2']);
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

describe('golden', () => {
  // a seed's draw and choices pinned: a change to the hash or the PRNG would give each phone another play
  it('the same ids and choice orders as ever for these seeds', () => {
    const d = [1, 2, 3].map((p) => draw(clip, {}, p, seedOf('A', 'test', p)).map((x) => x.id).join());
    const c = ['s1', 's2', 's3', 's4'].map((s) => choiceOrder(q('z2', 'detail', 'B1', { choices: ['a', 'b', 'c', 'd'] }), s).join(''));
    expect(d).toEqual(['d2,g2,n1,t1,p1,s1', 'd1,g2,w1,h1,k1,s1', 'd2,g2,n1,t1,h2,s1']);
    expect(c).toEqual(['3012', '3102', '1032', '3012']);
  });
});
