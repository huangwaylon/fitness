import { describe, expect, it } from 'vitest';
import { daysLeft, emptyFarm, FARM, farmFromJson, farmJson, farmOf, farmRefusal, farmStep, plotOf, stageOf, wateringCounts, yieldOf, type FarmData, type Plot } from './farm.ts';
import { gameWet, wxWetDays } from './wet.ts';
import { dayWeather } from '../components/island/weather.ts';
import { seeded } from '../random.ts';

const D = '2026-11-04', D1 = '2026-11-05', D2 = '2026-11-06', D3 = '2026-11-07';
const P = plotOf('field-A', 0, 0);
const none = () => false;
const judge = (watered: (p: string, d: string) => boolean = none, pocket = () => 99) => ({ watered, pocket });

describe('the fields (contract/farm.ts)', () => {
  it('a plant grows a stage a day, ripe on the third; harvested it is 2 till ripe again regrowDays on', () => {
    const f = emptyFarm();
    farmStep(f, 'A', { d: D, ops: [{ o: 'plant', p: P, c: 'tomato', src: 'start' }] }, judge());
    const pl = f.plots.get(P)!;
    expect([D, D1, D2, D3, '2026-11-20'].map((d) => stageOf(pl, d))).toEqual([0, 1, 2, 3, 3]);
    expect([D, D1, D2, D3, '2026-11-20'].map((d) => daysLeft(pl, d))).toEqual([3, 2, 1, 0, 0]);
    farmStep(f, 'A', { d: D3, ops: [{ o: 'harvest', p: P, n: 1 }] }, judge());
    const again = f.plots.get(P)!;
    expect(again.from).toBe('2026-11-10');
    expect([D3, '2026-11-08', '2026-11-09', '2026-11-10'].map((d) => stageOf(again, d))).toEqual([2, 2, 2, 3]);
  });

  it('yields 1, and 1 more for each of the three days before ripe it was watered (rain counts), at most 3', () => {
    const pl: Plot = { who: 'A', c: 'carrot', from: D3 };
    expect(yieldOf(P, pl, none)).toBe(1);
    expect(yieldOf(P, pl, (p, d) => p === P && d === D2)).toBe(2);
    expect(yieldOf(P, pl, (_p, d) => d === D1 || d === D2)).toBe(3);
    // the plant day counts: any 2 of the 3 give 3, all 3 still 3
    expect(yieldOf(P, pl, (_p, d) => d === D)).toBe(2);
    expect(yieldOf(P, pl, (_p, d) => d === D || d === D2)).toBe(3);
    expect(yieldOf(P, pl, (_p, d) => d >= D && d <= D2)).toBe(FARM.maxYield);
    expect(yieldOf(P, pl, (_p, d) => d === D3 || d === '2026-11-03')).toBe(1); // the day it ripens and before the window: no
    expect([D, D1, D2, D3].map((d) => wateringCounts(pl, d))).toEqual([true, true, true, false]);
  });

  it('a watering on the plant day and on the harvest day counts, the harvest before or after it', () => {
    const f = emptyFarm();
    const w = new Set<string>([D]);
    const watered = (_p: string, d: string) => w.has(d);
    farmStep(f, 'A', { d: D, ops: [{ o: 'plant', p: P, c: 'tomato', src: 'start' }] }, judge(watered));
    expect(wateringCounts(f.plots.get(P)!, D)).toBe(true);
    w.add(D2);
    // harvest day D3: ripe, its watering not its own (left 0) but the regrown plant's first (left 3)
    expect(wateringCounts(f.plots.get(P)!, D3)).toBe(false);
    w.add(D3); // watered before the harvest that day
    expect(farmStep(f, 'A', { d: D3, ops: [{ o: 'harvest', p: P, n: 1 }] }, judge(watered))?.ops).toEqual([{ o: 'harvest', p: P, n: 3 }]);
    const again = f.plots.get(P)!;
    expect(wateringCounts(again, D3)).toBe(true);
    w.add('2026-11-09');
    expect(farmStep(f, 'A', { d: '2026-11-10', ops: [{ o: 'harvest', p: P, n: 1 }] }, judge(watered))?.ops).toEqual([{ o: 'harvest', p: P, n: 3 }]);
    // harvested first, then watered the same day: the same
    const g = emptyFarm(), w2 = new Set<string>();
    const watered2 = (_p: string, d: string) => w2.has(d);
    farmStep(g, 'A', { d: D, ops: [{ o: 'plant', p: P, c: 'tomato', src: 'start' }] }, judge(watered2));
    farmStep(g, 'A', { d: D3, ops: [{ o: 'harvest', p: P, n: 1 }] }, judge(watered2));
    w2.add(D3);
    expect(farmStep(g, 'A', { d: '2026-11-10', ops: [{ o: 'harvest', p: P, n: 1 }] }, judge(watered2))?.ops).toEqual([{ o: 'harvest', p: P, n: 2 }]);
  });

  it('a kept harvest replays at its kept n, whatever the waterings now say (old rows stay valid)', () => {
    const f = emptyFarm();
    farmStep(f, 'A', { d: D, ops: [{ o: 'plant', p: P, c: 'pumpkin', src: 'start' }] });
    // kept under the two-day rule: the plant day watered, not counted, n 1
    expect(farmStep(f, 'A', { d: D3, ops: [{ o: 'harvest', p: P, n: 1 }] })?.ops).toEqual([{ o: 'harvest', p: P, n: 1 }]);
    expect(f.net.A?.get('goods:pumpkin')).toBe(1);
    expect(farmOf({ d: D3, ops: [{ o: 'harvest', p: P, n: 2 }] })).not.toBeNull();
  });

  it('the record judges each op: a refused one dropped, a harvest kept at its yield', () => {
    const f = emptyFarm();
    expect(farmStep(f, 'A', { d: D, ops: [{ o: 'plant', p: P, c: 'wheat', src: 'start' }] }, judge(none, () => 0))).toBeNull();
    const kept = farmStep(f, 'A', { d: D, ops: [{ o: 'plant', p: P, c: 'wheat', src: 'start' }, { o: 'plant', p: P, c: 'wheat', src: 'start' }] }, judge(none, () => 1));
    expect(kept?.ops).toHaveLength(1);
    expect(f.net.A?.get('goods:wheat-start')).toBe(-1);
    // another's plant: never harvested or dug; not ripe: no harvest
    expect(farmRefusal(f, 'B', D3, { o: 'harvest', p: P, n: 1 }, () => 0)).toBe('owner');
    expect(farmRefusal(f, 'B', D, { o: 'plant', p: P, c: 'wheat', src: 'start' }, () => 9)).toBe('taken');
    expect(farmRefusal(f, 'A', D2, { o: 'harvest', p: P, n: 1 }, () => 0)).toBe('unripe');
    const h = farmStep(f, 'A', { d: D3, ops: [{ o: 'harvest', p: P, n: 3 }] }, judge((_p, d) => d === D2));
    expect(h?.ops).toEqual([{ o: 'harvest', p: P, n: 2 }]);
    expect(f.net.A?.get('goods:wheat')).toBe(2);
    farmStep(f, 'A', { d: D3, ops: [{ o: 'dig', p: P }] }, judge());
    expect(f.plots.size).toBe(0);
    expect(f.net.A?.get('goods:wheat-start')).toBe(0);
  });

  it(`at most ${FARM.cap} plants each, whoever else farms`, () => {
    const f = emptyFarm();
    const ops = (n: number, row: number): FarmData['ops'] => Array.from({ length: n }, (_, i) => ({ o: 'plant', p: plotOf('f', i, row), c: 'potato', src: 'start' }));
    farmStep(f, 'A', { d: D, ops: ops(FARM.cap, 0) }, judge());
    farmStep(f, 'B', { d: D, ops: ops(3, 1) }, judge());
    expect(farmRefusal(f, 'A', D, { o: 'plant', p: plotOf('f', 0, 2), c: 'potato', src: 'start' }, () => 9)).toBe('cap');
    expect(farmRefusal(f, 'B', D, { o: 'plant', p: plotOf('f', 3, 1), c: 'potato', src: 'start' }, () => 9)).toBeNull();
  });

  it('a batch is checked for its shape', () => {
    expect(farmOf({ d: D, ops: [{ o: 'plant', p: P, c: 'tomato', src: 'start' }] })).not.toBeNull();
    expect(farmOf({ d: D, ops: [] })).toBeNull();
    expect(farmOf({ d: D, ops: [{ o: 'plant', p: 'fl:1:2', c: 'tomato', src: 'start' }] })).toBeNull();
    expect(farmOf({ d: D, ops: [{ o: 'harvest', p: P, n: 4 }] })).toBeNull();
    expect(farmOf({ d: D, ops: [{ o: 'dig', p: P, x: 1 }] })).toBeNull();
    expect(farmOf({ d: D, ops: Array.from({ length: FARM.batchMax + 1 }, () => ({ o: 'dig', p: P })) })).toBeNull();
  });

  it('a random log folds the same op by op (the record’s running copy through JSON) as all at once', () => {
    const r = seeded('farm-fold');
    const who = ['A', 'B', 'G'] as const, days = [D, D1, D2, D3, '2026-11-08', '2026-11-09', '2026-11-10'];
    const log: { who: (typeof who)[number]; data: FarmData }[] = [];
    for (let i = 0; i < 300; i++) {
      const w = who[Math.floor(r() * 3)], p = plotOf('f', Math.floor(r() * 4), Math.floor(r() * 3)), d = days[Math.floor((i / 300) * days.length)];
      const k = r();
      const op: FarmData['ops'][number] = k < 0.4 ? { o: 'plant', p, c: 'tomato', src: 'start' } : k < 0.8 ? { o: 'harvest', p, n: 1 } : { o: 'dig', p };
      log.push({ who: w, data: { d, ops: [op] } });
    }
    const watered = (p: string, d: string) => (p.length + d.length + Number(d.slice(-1))) % 3 === 0;
    // the record: each kept as judged, the field kept as JSON between rows
    let running = emptyFarm();
    const kept: typeof log = [];
    for (const e of log) {
      const k = farmStep(running, e.who, e.data, judge(watered));
      if (k) kept.push({ who: e.who, data: k });
      running = farmFromJson(JSON.parse(JSON.stringify(farmJson(running))))!;
    }
    // a phone: the kept rows as kept
    const whole = emptyFarm();
    for (const e of kept) farmStep(whole, e.who, e.data);
    expect(farmJson(whole)).toEqual(farmJson(running));
    expect(kept.length).toBeGreaterThan(20);
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
