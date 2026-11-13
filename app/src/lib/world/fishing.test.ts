import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import {
  BITE_WINDOW_MS, FLY_MS, NOTICE_U, cast, due, plan, pull, step, type Around, type Line, type Step
} from './fishing.ts';

const DAY = '2026-11-04';
/** An island round the float: my villager dozing or not, at most one shadow (`fish`, `d` u off) that notices it. */
function around(o: { day?: string; fish?: string | null; d?: number; here?: boolean; seed?: number } = {}): Around {
  const fish = o.fish === undefined ? 'fish-sea-1' : o.fish;
  return {
    day: o.day ?? DAY, rand: mulberry32(o.seed ?? 7),
    notice: () => (fish ? { fish, d: o.d ?? 60 } : null),
    here: () => o.here ?? true
  };
}
const out = (t = 0): Line => cast({ x: 0, z: 0, water: 'sea' }, t, DAY);
/** Steps the line from `t0` to `t1` every `dt` ms: every step it took, and the line at the end. */
function run(l: Line, t0: number, t1: number, w: Around, dt = 33): { line: Line | null; steps: (Step & { t: number })[] } {
  const steps: (Step & { t: number })[] = [];
  let cur: Line | null = l;
  for (let t = t0; t <= t1 && cur; t += dt) {
    const r = step(cur, t, w);
    steps.push(...r.steps.map((s) => ({ ...s, t })));
    cur = r.line;
  }
  return { line: cur, steps };
}

describe('a cast at any distance (the user: "I want to be able to fish from anywhere")', () => {
  it('a float across the island lands, is noticed where it is, bites and is caught, the line never ending by itself', () => {
    const far = { x: 2400, z: -1800, water: 'sea' as const }, asked: [number, number][] = [];
    const w: Around = { ...around(), notice: (x, z) => (asked.push([x, z]), { fish: 'fish-sea-1', d: 60 }) };
    let l: Line | null = cast(far, 0, DAY);
    expect(l).toMatchObject({ phase: 'flying', x: far.x, z: far.z, water: 'sea' });
    const evs: string[] = [];
    for (let t = 0; l && l.phase !== 'bite' && t < 20_000; t += 33) {
      const r = step(l, t, w);
      evs.push(...r.steps.map((s) => s.ev));
      l = r.line;
    }
    expect(l?.phase).toBe('bite');
    expect(evs).not.toContain('off');
    expect(evs.slice(0, 3)).toEqual(['land', 'notice', 'arrive']);
    // (the shadows are looked for round the float, never round my villager)
    expect(asked.every(([x, z]) => x === far.x && z === far.z)).toBe(true);
    expect(pull(l!)).toEqual({ ev: 'catch', fish: 'fish-sea-1' });
  });
});

describe('the plan: NH’s approach, 1–4 nibbles, the bite', () => {
  it('from any distance and any dice: arrive, then the nibbles in order, then the bite, all within a few seconds', () => {
    const counts = new Set<number>();
    for (let s = 0; s < 400; s++) {
      const p = plan((s % 5) * (NOTICE_U / 4), mulberry32(s));
      counts.add(p.nibbles.length);
      expect(p.nibbles.length).toBeGreaterThanOrEqual(1);
      expect(p.nibbles.length).toBeLessThanOrEqual(4);
      expect(p.arrive).toBeGreaterThan(0);
      expect(p.nibbles[0]).toBeGreaterThan(p.arrive);
      for (let i = 1; i < p.nibbles.length; i++) expect(p.nibbles[i] - p.nibbles[i - 1]).toBeGreaterThanOrEqual(600);
      expect(p.bite - p.nibbles.at(-1)!).toBeGreaterThanOrEqual(600);
      expect(p.bite).toBeLessThan(9000);
    }
    expect([...counts].sort()).toEqual([1, 2, 3, 4]);
    // a shadow further off takes longer to swim up
    expect(plan(NOTICE_U, () => 0.5).arrive).toBeGreaterThan(plan(10, () => 0.5).arrive);
    // the same dice, the same story
    expect(plan(80, mulberry32(3))).toEqual(plan(80, mulberry32(3)));
  });
});

describe('the line', () => {
  it('flies out, lands, waits; a shadow notices it, swims up, nibbles, bites; no tap in the window and it gets away, the float still out', () => {
    const w = around();
    const r = run(out(0), 0, 20_000, w);
    // (the first shadow's story: the mock's next notices it again)
    r.steps.splice(r.steps.findIndex((s) => s.ev === 'escape') + 1);
    const evs = r.steps.map((s) => s.ev);
    expect(evs.slice(0, 3)).toEqual(['land', 'notice', 'arrive']);
    const notice = r.steps.find((s) => s.ev === 'notice')! as Extract<Step, { ev: 'notice' }> & { t: number };
    const nibbles = r.steps.filter((s) => s.ev === 'nibble');
    expect(nibbles.length).toBe(notice.plan.nibbles.length);
    expect(nibbles.map((s) => (s as Extract<Step, { ev: 'nibble' }>).n)).toEqual(notice.plan.nibbles.map((_, i) => i + 1));
    const land = r.steps.find((s) => s.ev === 'land')!, bite = r.steps.find((s) => s.ev === 'bite')!, esc = r.steps.find((s) => s.ev === 'escape')!;
    expect(land.t).toBeGreaterThanOrEqual(FLY_MS);
    expect(land.t).toBeLessThan(FLY_MS + 33);
    expect(bite.t - notice.t).toBeGreaterThanOrEqual(notice.plan.bite);
    expect(esc.t - bite.t).toBeGreaterThanOrEqual(BITE_WINDOW_MS);
    expect(esc.t - bite.t).toBeLessThan(BITE_WINDOW_MS + 34);
    // (the escaped shadow is gone: the next to notice is another; here the same dice's says it again)
    expect(r.line).not.toBeNull();
  });
  it('waits for as long as it takes when nobody comes (no line vanishing on its own)', () => {
    const r = run(out(0), 0, 120_000, around({ fish: null }), 500);
    expect(r.steps.map((s) => s.ev)).toEqual(['land']);
    expect(r.line?.phase).toBe('waiting');
    expect(due(r.line!)).toBe(Infinity);
  });
  it('a shadow that comes by later notices the waiting float', () => {
    let near = false;
    const w: Around = { ...around(), notice: () => (near ? { fish: 'fish-pond-2', d: 50 } : null) };
    let l = step(out(0), 400, w).line!;
    expect(l.phase).toBe('waiting');
    l = step(l, 5000, w).line!;
    expect(l.phase).toBe('waiting');
    near = true;
    const r = step(l, 5250, w);
    expect(r.steps).toEqual([{ ev: 'notice', fish: 'fish-pond-2', plan: expect.anything() }]);
    expect(r.line).toMatchObject({ phase: 'approach', fish: 'fish-pond-2', noticed: 5250 });
  });
  it('a late step catches up in order, and the bite it enters gets its whole window from when it shows', () => {
    const w = around();
    let l = step(out(0), FLY_MS, w).line!; // landed and noticed at FLY_MS
    expect(l.phase).toBe('approach');
    const p = l.plan!;
    // the main thread was busy: the next step comes 5 s after the bite was due
    const late = l.noticed + p.bite + 5000;
    const r = step(l, late, w);
    expect(r.steps.map((s) => s.ev)).toEqual(['arrive', ...p.nibbles.map(() => 'nibble'), 'bite']);
    l = r.line!;
    expect(l).toMatchObject({ phase: 'bite', since: late });
    expect(due(l)).toBe(late + BITE_WINDOW_MS);
    expect(step(l, late + BITE_WINDOW_MS - 1, w).line?.phase).toBe('bite');
    expect(pull(step(l, late + BITE_WINDOW_MS - 1, w).line!)).toEqual({ ev: 'catch', fish: 'fish-sea-1' });
    expect(step(l, late + BITE_WINDOW_MS, w).steps).toEqual([{ ev: 'escape', fish: 'fish-sea-1' }]);
  });
  it('due is when its next step is: the landing, the arrival, each nibble, the bite, the end of the window', () => {
    const w = around();
    let l: Line = out(100);
    expect(due(l)).toBe(100 + FLY_MS);
    l = step(l, 100 + FLY_MS, w).line!;
    const p = l.plan!, t0 = l.noticed;
    expect(due(l)).toBe(t0 + p.arrive);
    l = step(l, t0 + p.arrive, w).line!;
    for (let i = 0; i < p.nibbles.length; i++) {
      expect(due(l)).toBe(t0 + p.nibbles[i]);
      // a step a moment early does nothing
      expect(step(l, t0 + p.nibbles[i] - 1, w).steps).toEqual([]);
      l = step(l, t0 + p.nibbles[i], w).line!;
      expect(l.nibbles).toBe(i + 1);
    }
    expect(due(l)).toBe(t0 + p.bite);
    l = step(l, t0 + p.bite, w).line!;
    expect(due(l)).toBe(t0 + p.bite + BITE_WINDOW_MS);
  });
});

describe('a tap on the line (NH’s A button), judged on the line as it shows', () => {
  const at = (phase: Line['phase']): Line => {
    const w = around();
    let l: Line = out(0);
    for (let t = 0; l.phase !== phase && t < 20_000; t += 10) l = step(l, t, w).line!;
    expect(l.phase).toBe(phase);
    return l;
  };
  it('in the air or waiting: reeled in, nothing on it', () => {
    expect(pull(out(0))).toEqual({ ev: 'reel' });
    expect(pull(step(out(0), FLY_MS, around({ fish: null })).line!)).toEqual({ ev: 'reel' });
  });
  it('a shadow swimming up or nibbling: scared off (NH’s early pull)', () => {
    expect(pull(at('approach'))).toEqual({ ev: 'scare', fish: 'fish-sea-1' });
    expect(pull(at('nibble'))).toEqual({ ev: 'scare', fish: 'fish-sea-1' });
  });
  it('the bite: caught', () => {
    expect(pull(at('bite'))).toEqual({ ev: 'catch', fish: 'fish-sea-1' });
  });
  it('after it got away: reeled in, nothing on it', () => {
    const l = at('bite');
    const r = step(l, l.since + BITE_WINDOW_MS, around({ fish: null }));
    expect(r.line?.phase).toBe('waiting');
    expect(pull(r.line!)).toEqual({ ev: 'reel' });
  });
});

describe('the line ends on its own (the float just goes): nothing left hanging', () => {
  const l = (): Line => step(out(0), FLY_MS, around({ fish: null })).line!;
  it('the day changed (the island’s day: its shadows are a new day’s)', () => {
    expect(step(l(), 1000, around({ day: '2026-11-05' }))).toEqual({ line: null, steps: [{ ev: 'off', why: 'day' }] });
  });
  it('the shadow at it went (another phone caught it, it left): the float waits on, and the next shadow can come', () => {
    let l: Line = step(out(0), FLY_MS, around()).line!;
    expect(l.phase).toBe('approach');
    const r = step(l, FLY_MS + 100, around({ here: false }));
    expect(r.steps).toEqual([{ ev: 'lost', fish: 'fish-sea-1' }]);
    l = r.line!;
    expect(l).toMatchObject({ phase: 'waiting', fish: null, plan: null });
    expect(step(l, FLY_MS + 400, around({ fish: 'fish-sea-9' })).line).toMatchObject({ phase: 'approach', fish: 'fish-sea-9' });
  });
  it('a bite whose shadow went: lost, not caught', () => {
    const w = around();
    let l: Line = out(0);
    for (let t = 0; l.phase !== 'bite'; t += 10) l = step(l, t, w).line!;
    const r = step(l, l.since + 10, around({ here: false }));
    expect(r.steps).toEqual([{ ev: 'lost', fish: 'fish-sea-1' }]);
    expect(pull(r.line!)).toEqual({ ev: 'reel' });
  });
});
