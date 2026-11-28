import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips/index.ts';
import { PLANNED } from './plan-order.ts';
import { opener, planOf } from './plan.ts';

const SHOW = { F: 'Friends', O: 'The Office', P: 'Parks and Recreation' } as const;
const clip = (id: string, wpm: number, show: keyof typeof SHOW, tags: string[] = ['家'], dur = 120, band: 'slow' | 'mid' | 'fast' = 'mid') => ({ id, wpm, dur, band, tags, show: SHOW[show], questions: [] });

describe('the shared plan', () => {
  it('holds every clip once, the written order first', () => {
    const plan = planOf(CLIPS).map((c) => c.id);
    expect(plan.toSorted()).toEqual(CLIPS.map((c) => c.id).toSorted());
    expect(new Set(PLANNED).size).toBe(PLANNED.length);
    const kept = PLANNED.filter((id) => CLIPS.some((c) => c.id === id));
    expect(plan.slice(0, kept.length)).toEqual(kept);
  });

  it('puts a clip added later after the planned ones, however easy', () => {
    const lib = [clip('b', 150, 'F'), clip('c', 180, 'P'), clip('a', 100, 'F')];
    expect(planOf(lib, ['b', 'c', 'gone']).map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('ramps slowly: easier first, a clip at most a window ahead of its rank', () => {
    const lib = Array.from({ length: 30 }, (_, i) => clip(`c${i}`, 100 + 4 * i, 'FOP'[i % 3] as 'F', [['家', '職場', '電話'][i % 3]]));
    const plan = planOf(lib, []).map((c) => c.id);
    for (const [i, id] of plan.entries()) expect(Number(id.slice(1))).toBeLessThan(i + 5);
    expect(plan[0]).toBe('c0');
  });

  it('puts the openers first (≤ 90 s, a well-known show, not fast), however slow the others', () => {
    const lib = [clip('a', 100, 'F'), clip('b', 100, 'P', ['家'], 80), clip('c', 160, 'O', ['職場'], 85), clip('d', 170, 'F', ['電話'], 70, 'fast'), clip('e', 180, 'F', ['電話'], 90, 'slow')];
    expect(planOf(lib, []).map((c) => c.id).slice(0, 2).toSorted()).toEqual(['c', 'e']);
  });

  it('starts the written plan with the openers', () => {
    const n = CLIPS.filter(opener).length;
    expect(n).toBeGreaterThan(5);
    expect(planOf(CLIPS).slice(0, n).every(opener)).toBe(true);
  });

  it('puts the late clips after all the others, however easy', () => {
    const lib = [clip('a', 100, 'F'), clip('b', 150, 'O', ['職場']), clip('c', 180, 'P', ['電話'])];
    expect(planOf(lib, [], new Set(['a'])).map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('never three of a show or a situation in a row when a near clip avoids it, the shows at about their share', () => {
    // by ease the shows would come in runs of three
    const lib = Array.from({ length: 12 }, (_, i) => clip(`c${i}`, 100 + i, 'FOP'[Math.floor(i / 3) % 3] as 'F', [Math.floor(i / 3) % 2 ? '職場' : '家']));
    const plan = planOf(lib, []);
    for (let i = 2; i < plan.length - 2; i++) {
      const [a, b, c] = plan.slice(i - 2, i + 1);
      expect(new Set([a, b, c].map((x) => x.show)).size).toBeGreaterThan(1);
      expect(c.tags.some((t) => a.tags.includes(t) && b.tags.includes(t))).toBe(false);
    }
  });
});
