import { describe, expect, it } from 'vitest';
import { emptyFarm, FARM, farmOf, farmRefusal, farmStep, fieldFromJson, fieldJson, needsWater, nextStageAt, plotOf, stageOf, yieldOf, type FarmData, type Plot } from './farm.ts';
import { gameWet, wxWetDays } from './wet.ts';
import { dayWeather } from '#lib/world/weather.ts';
import { seeded } from '../random.ts';

// 2026-11-04 12:00 Tokyo
const T = Date.parse('2026-11-04T03:00:00.000Z');
const H = 3600_000, G = FARM.growMs;
const D = '2026-11-04', D1 = '2026-11-05';
const P = plotOf('field', 0, 0), Q = plotOf('field', 1, 0);
const dry = () => false;
const judge = (wet: (d: string) => boolean = dry, pocket = () => 99) => ({ wet, pocket });
const plant = (p = P, c: 'tomato' | 'wheat' = 'tomato'): FarmData => ({ ops: [{ o: 'plant', p, c, src: 'start' }] });
const op = (o: 'harvest' | 'water' | 'dig', p = P): FarmData => ({ ops: [o === 'harvest' ? { o, p, n: 1 } : { o, p }] });

describe('the shared field (contract/farm.ts)', () => {
  it('ripe growMs (6 h) after planting, stages 0/1/2 by thirds; harvested it grows back at 2, ripe growMs on', () => {
    const f = emptyFarm();
    farmStep(f, 'A', plant(), T, judge());
    const pl = f.plots.get(P)!;
    expect(pl).toEqual({ c: 'tomato', t: T + G });
    expect(G).toBe(6 * H);
    expect([-H, 0, 2 * H - 1, 2 * H, 4 * H, G - 1, G, 9 * H].map((d) => stageOf(pl, T + d))).toEqual([0, 0, 0, 1, 2, 2, 3, 3]);
    expect([0, 2 * H, 5 * H, G].map((d) => nextStageAt(pl, T + d))).toEqual([T + 2 * H, T + 4 * H, T + G, null]);
    expect(farmStep(f, 'B', op('harvest'), T + 7 * H, judge())?.ops).toEqual([{ o: 'harvest', p: P, n: 1 }]);
    const again = f.plots.get(P)!;
    expect(again).toEqual({ c: 'tomato', t: T + 7 * H + G, r: true, by: 'B' });
    expect([7 * H, 10 * H, 7 * H + G].map((d) => stageOf(again, T + d))).toEqual([2, 2, 3]);
    expect(nextStageAt(again, T + 8 * H)).toBe(T + 7 * H + G);
  });

  it('yields 3 if watered this growth, or rain the Tokyo day it started or ripens; else 1', () => {
    const pl: Plot = { c: 'carrot', t: T + G }; // 12:00 → 18:00 D
    expect(yieldOf(pl, dry)).toBe(1);
    expect(yieldOf({ ...pl, w: true }, dry)).toBe(FARM.maxYield);
    expect(yieldOf(pl, (d) => d === D)).toBe(FARM.maxYield);
    expect(yieldOf(pl, (d) => d === D1)).toBe(1);
    // started 21:00 D, ripe 03:00 D1: either day's rain
    const late: Plot = { c: 'carrot', t: T + 9 * H + G };
    expect([D, D1, '2026-11-06'].map((w) => yieldOf(late, (d) => d === w))).toEqual([3, 3, 1]);
  });

  it('anyone waters while it grows, once a growth; a harvest starts a dry growth', () => {
    const f = emptyFarm();
    farmStep(f, 'A', plant(), T, judge());
    expect(needsWater(f.plots.get(P)!, T)).toBe(true);
    expect(farmStep(f, 'G', { ops: [{ o: 'water', p: P }, { o: 'water', p: P }] }, T + H, judge())?.ops).toEqual([{ o: 'water', p: P }]);
    expect(f.plots.get(P)).toEqual({ c: 'tomato', t: T + G, w: true });
    expect(farmRefusal(f, T + H, { o: 'water', p: P }, () => 0)).toBe('watered');
    expect(farmStep(f, 'B', op('harvest'), T + G, judge())?.ops).toEqual([{ o: 'harvest', p: P, n: 3 }]);
    expect(f.net.B?.get('goods:tomato')).toBe(3);
    expect(f.net.A?.get('goods:tomato')).toBeUndefined();
    expect(f.plots.get(P)!.w).toBeUndefined();
    expect(farmStep(f, 'A', op('harvest'), T + 2 * G, judge())?.ops).toEqual([{ o: 'harvest', p: P, n: 1 }]);
    // ripe: a watering can't count
    expect(needsWater(f.plots.get(P)!, T + 3 * G)).toBe(false);
    expect(farmRefusal(f, T + 3 * G, { o: 'water', p: P }, () => 0)).toBe('ripe');
  });

  it('the record judges each op against the field and the sender’s pocket: a refused one dropped', () => {
    const f = emptyFarm();
    expect(farmStep(f, 'A', plant(P, 'wheat'), T, judge(dry, () => 0))).toBeNull(); // seed
    const kept = farmStep(f, 'A', { ops: [...plant(P, 'wheat').ops, ...plant(P, 'wheat').ops, ...plant(Q, 'wheat').ops] }, T, judge(dry, () => 1));
    expect(kept?.ops).toEqual(plant(P, 'wheat').ops); // taken; then one start only
    expect(f.net.A?.get('goods:wheat-start')).toBe(-1);
    expect(farmRefusal(f, T, { o: 'plant', p: P, c: 'wheat', src: 'start' }, () => 9)).toBe('taken');
    expect(farmRefusal(f, T, { o: 'plant', p: Q, c: 'wheat', src: 'crop' }, (k) => (k === 'goods:wheat' ? 0 : 9))).toBe('seed');
    expect(farmRefusal(f, T + G - 1, { o: 'harvest', p: P, n: 1 }, () => 0)).toBe('unripe');
    for (const o of ['harvest', 'water', 'dig'] as const) expect(farmRefusal(f, T, op(o, Q).ops[0], () => 0)).toBe('empty');
    // anyone digs: the start the digger's
    expect(farmStep(f, 'G', op('dig'), T + H, judge())?.ops).toEqual([{ o: 'dig', p: P }]);
    expect(f.plots.size).toBe(0);
    expect(f.net.G?.get('goods:wheat-start')).toBe(1);
  });

  it('a kept row replays as kept (a harvest at its n, an op that can’t apply now skipped): old rows stay valid', () => {
    const f = emptyFarm();
    farmStep(f, 'A', plant(), T);
    // an old relay's harvest, kept sooner than 6 h on and at n 3: replayed so
    expect(farmStep(f, 'A', { ops: [{ o: 'harvest', p: P, n: 3 }] }, T + H)?.ops).toEqual([{ o: 'harvest', p: P, n: 3 }]);
    expect(f.net.A?.get('goods:tomato')).toBe(3);
    expect(farmStep(f, 'A', op('dig', Q), T + H)).toBeNull();
  });

  it('a harvest says who (`by`), kept while it grows back and through JSON; a dig or a new plant has none', () => {
    const f = emptyFarm();
    farmStep(f, 'A', plant(), T, judge());
    expect(f.plots.get(P)!.by).toBeUndefined();
    farmStep(f, 'B', op('harvest'), T + G, judge());
    expect(f.plots.get(P)).toEqual({ c: 'tomato', t: T + 2 * G, r: true, by: 'B' });
    farmStep(f, 'G', op('water'), T + G + H, judge());
    expect(f.plots.get(P)!.by).toBe('B');
    farmStep(f, 'G', op('harvest'), T + 2 * G, judge());
    expect(f.plots.get(P)!.by).toBe('G');
    expect(fieldFromJson(JSON.parse(JSON.stringify(fieldJson(f))))!.plots.get(P)).toEqual(f.plots.get(P));
    // an older relay's plant (none), a bad one or one not growing back: none
    expect(fieldFromJson([[P, { c: 'tomato', t: 1, r: true }], [Q, { c: 'tomato', t: 1, r: true, by: 'X' }]])!.plots.get(P)!.by).toBeUndefined();
    expect(fieldFromJson([[Q, { c: 'tomato', t: 1, r: true, by: 'X' }]])!.plots.get(Q)!.by).toBeUndefined();
    expect(fieldFromJson([[Q, { c: 'tomato', t: 1, by: 'A' }]])!.plots.get(Q)!.by).toBeUndefined();
    farmStep(f, 'A', op('dig'), T + 2 * G, judge());
    farmStep(f, 'A', plant(), T + 2 * G, judge());
    expect(f.plots.get(P)!.by).toBeUndefined();
  });

  it('a batch is checked for its shape; an older build’s day dropped', () => {
    expect(farmOf({ ops: plant().ops })).toEqual(plant());
    expect(farmOf({ d: D, ops: plant().ops })).toEqual(plant());
    expect(farmOf({ d: D, x: 1, ops: plant().ops })).toBeNull();
    expect(farmOf({ ops: [] })).toBeNull();
    expect(farmOf({ ops: [{ o: 'plant', p: 'fl:1:2', c: 'tomato', src: 'start' }] })).toBeNull();
    expect(farmOf({ ops: [{ o: 'harvest', p: P, n: 4 }] })).toBeNull();
    expect(farmOf({ ops: [{ o: 'water', p: P, n: 1 }] })).toBeNull();
    expect(farmOf({ ops: [{ o: 'dig', p: P, x: 1 }] })).toBeNull();
    expect(farmOf({ ops: Array.from({ length: FARM.batchMax + 1 }, () => ({ o: 'dig', p: P })) })).toBeNull();
  });

  it('the stored field: sorted [plot, plant] pairs and back; an older relay’s {p, n} is none', () => {
    const f = emptyFarm();
    farmStep(f, 'A', { ops: [...plant(Q).ops, ...plant(P).ops, { o: 'water', p: P }] }, T, judge());
    expect(fieldJson(f)).toEqual([[P, { c: 'tomato', t: T + G, w: true }], [Q, { c: 'tomato', t: T + G }]]);
    expect(fieldFromJson(JSON.parse(JSON.stringify(fieldJson(f))))).toEqual({ plots: f.plots, net: {} });
    expect(fieldFromJson({ p: [[P, { who: 'A', c: 'tomato', from: D1 }]], n: {} })).toBeNull();
    expect(fieldFromJson([[P, { c: 'turnip', t: 1 }], [Q, { c: 'tomato', t: 'x' }]])?.plots.size).toBe(0);
  });

  it('a random log folds the same op by op (the record’s stored field through JSON) as all at once', () => {
    const r = seeded('farm-fold');
    const who = ['A', 'B', 'G'] as const;
    const log: { who: (typeof who)[number]; at: number; data: FarmData }[] = [];
    let at = T;
    for (let i = 0; i < 300; i++) {
      at += Math.floor(r() * 2 * H);
      const w = who[Math.floor(r() * 3)], p = plotOf('f', Math.floor(r() * 4), Math.floor(r() * 3)), k = r();
      const o: FarmData['ops'][number] = k < 0.35 ? { o: 'plant', p, c: 'tomato', src: 'start' } : k < 0.5 ? { o: 'water', p } : k < 0.85 ? { o: 'harvest', p, n: 1 } : { o: 'dig', p };
      log.push({ who: w, at, data: { ops: [o] } });
    }
    const wet = (d: string) => Number(d.slice(-1)) % 3 === 0;
    let running = emptyFarm();
    const kept: typeof log = [];
    for (const e of log) {
      const k = farmStep(running, e.who, e.data, e.at, judge(wet));
      if (k) kept.push({ ...e, data: k });
      running = fieldFromJson(JSON.parse(JSON.stringify(fieldJson(running))))!;
    }
    const whole = emptyFarm();
    for (const e of kept) farmStep(whole, e.who, e.data, e.at);
    expect(fieldJson(whole)).toEqual(fieldJson(running));
    expect(kept.length).toBeGreaterThan(50);
    expect(kept.some((e) => e.data.ops[0].o === 'harvest' && (e.data.ops[0] as { n: number }).n === 3)).toBe(true);
  });
});

describe('wet days (contract/wet.ts)', () => {
  it('the seeded wet days are the seeded weather’s', () => {
    for (let i = 0; i < 400; i++) {
      const d = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      expect(gameWet(d), d).toBe(dayWeather(d).pattern !== 'clear');
    }
  });

  it('a real timeline’s wet days: the Tokyo days of its wet hours begun', () => {
    // 2026-11-04 14:00 UTC = 23:00 Tokyo: rain then, and at 00:00 (the 5th), and an hour still to come
    const h0 = Date.parse('2026-11-04T14:00:00Z') / 3600_000;
    expect(wxWetDays({ h0, s: 'rcrr' }, Date.parse('2026-11-04T16:30:00Z'))).toEqual([D, D1]);
    expect(wxWetDays({ h0, s: 'cccc' }, Date.parse('2026-11-04T16:30:00Z'))).toEqual([]);
    expect(wxWetDays(null, 0)).toEqual([]);
  });
});
