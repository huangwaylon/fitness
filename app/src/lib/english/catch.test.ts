// 聞き取りチャレンジ's pure play (catch.ts): tiles in the order heard, a tile out of order placing the next for them,
// the honesty rule, the karaoke's lit chunk and a lesson's lines.
import { describe, expect, it } from 'vitest';
import { catching, clean, done, howOf, lessonLines, litAt, tap } from './catch.ts';
import type { CatchLine } from './types.ts';

const line: CatchLine = { q: 'x1', seg: [10, 12.5], tiles: ['I', 'haven’t told', 'him', 'yet'], t: [10.3, 10.6, 11.2, 11.6], ja: 'まだ言ってない', x: ['them'] };
const idx = (c: ReturnType<typeof catching>, t: string) => c.all.findIndex((x, i) => x === t && !c.used.includes(i));

describe('catching', () => {
  it('shows every chunk and distractor once, never in the line’s own order', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const c = catching(line, seed);
      expect([...c.order].sort()).toEqual([0, 1, 2, 3, 4]);
      expect(c.order).not.toEqual([0, 1, 2, 3, 4]);
    }
    expect(catching(line, 'a').order).toEqual(catching(line, 'a').order);
  });
  it('in order: placed, then done; caught clean', () => {
    let c = catching(line, 's');
    for (const [k, t] of line.tiles.entries()) {
      const r = tap(c, line, idx(c, t));
      expect(r.what).toBe(k === line.tiles.length - 1 ? 'done' : 'placed');
      c = r.c;
    }
    expect(done(c, line)).toBe(true);
    expect(howOf(c)).toEqual({ slow: false, hints: 0, miss: 0 });
    expect(clean(howOf(c))).toBe(true);
    // any tap once done: nothing
    expect(tap(c, line, 4).what).toBe('none');
  });
  it('a tile out of order bounces: the next chunk is placed for them, slowed; never counted clean', () => {
    let c = catching(line, 's');
    c = tap(c, line, idx(c, 'I')).c;
    const r = tap(c, line, idx(c, 'them'));
    expect(r.what).toBe('hint');
    expect(r.c.used.map((i) => r.c.all[i])).toEqual(['I', 'haven’t told']);
    expect(r.c.given).toEqual([1]);
    c = tap(r.c, line, idx(r.c, 'him')).c;
    const end = tap(c, line, idx(c, 'yet'));
    expect(end.what).toBe('done');
    expect(howOf(end.c)).toEqual({ slow: true, hints: 1, miss: 1 });
    expect(clean(howOf(end.c))).toBe(false);
  });
  it('a miss on the last chunk completes the line for them; a placed tile tapped again: nothing', () => {
    let c = catching(line, 's');
    for (const t of ['I', 'haven’t told', 'him']) c = tap(c, line, idx(c, t)).c;
    expect(tap(c, line, c.used[0]).what).toBe('none');
    const r = tap(c, line, idx(c, 'them'));
    expect(r.what).toBe('done');
    expect(r.c.used.map((i) => r.c.all[i])).toEqual(line.tiles);
  });
  it('a chunk said twice: either tile places it', () => {
    const twice: CatchLine = { ...line, tiles: ['really', 'really', 'awful'], t: [1, 1.4, 1.8], x: ['real'] };
    let c = catching(twice, 's');
    c = tap(c, twice, 1).c;
    c = tap(c, twice, 0).c;
    expect(tap(c, twice, 2).what).toBe('done');
  });
  it('clean: no slow, no hint, no miss', () => {
    expect(clean({ slow: false, hints: 0, miss: 0 })).toBe(true);
    expect(clean({ slow: true, hints: 0, miss: 0 })).toBe(false);
    expect(clean({ slow: false, hints: 1, miss: 0 })).toBe(false);
    expect(clean({ slow: false, hints: 0, miss: 1 })).toBe(false);
  });
});

describe('litAt', () => {
  it('lights the last chunk begun', () => {
    expect(litAt(line, 10)).toBe(-1);
    expect(litAt(line, 10.3)).toBe(0);
    expect(litAt(line, 11.3)).toBe(2);
    expect(litAt(line, 20)).toBe(3);
  });
});

describe('lessonLines', () => {
  const l = (q: string, at: number): CatchLine => ({ ...line, q, seg: [at, at + 2] });
  const all = [l('a', 50), l('b', 10), l('c', 30), l('d', 70)];
  it('two at most, none on the shelf, undrawn ones first, in clip order', () => {
    const got = lessonLines(all, (q) => q === 'a', new Set(['b', 'c']), 's');
    expect(got.map((x) => x.q)).toContain('d');
    expect(got).toHaveLength(2);
    expect(got.map((x) => x.q)).not.toContain('a');
    expect(got[0].seg[0]).toBeLessThan(got[1].seg[0]);
    expect(lessonLines(undefined, () => false, new Set(), 's')).toEqual([]);
    expect(lessonLines(all, () => true, new Set(), 's')).toEqual([]);
  });
});
