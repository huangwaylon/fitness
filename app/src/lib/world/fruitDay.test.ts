import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { fruitDay, fruitFilter, fruitGoods, fruitId, fruitMet, greyAt, markDropped, markPicked, stageOf } from './fruitDay.ts';
import { sellPrice } from '#lib/contract/shop.ts';
import { pickMaySend } from '#lib/contract/live-protocol.ts';
import { TREE_FRUIT } from '../components/island/scene.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';

function memKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

beforeEach(() => configureStorage({ local: memKV() }));

describe('progress → colour', () => {
  it('grey at 0, full colour at the goal, linear between, clamped', () => {
    expect(greyAt(0)).toBe(1);
    expect(greyAt(25)).toBe(0.75);
    expect(greyAt(50)).toBe(0.5);
    expect(greyAt(99)).toBe(0.01);
    expect(greyAt(100)).toBe(0);
    expect(greyAt(140)).toBe(0);
    expect(greyAt(-5)).toBe(1);
  });
  it('each bit of progress shows: greyer never comes with more progress', () => {
    for (let p = 0; p < 100; p++) expect(greyAt(p + 1)).toBeLessThanOrEqual(greyAt(p));
  });
  it('the filter: grey and washed lighter at 0, half at 50, none at the goal', () => {
    expect(fruitFilter(0)).toBe('grayscale(1) brightness(1.40) contrast(0.70)');
    expect(fruitFilter(50)).toBe('grayscale(0.5) brightness(1.20) contrast(0.85)');
    expect(fruitFilter(100)).toBe('none');
  });
});

describe('a fruit through the day', () => {
  const id = fruitId('A', 'apple');
  it('hangs while not met, falls once when first seen met, then lies on the ground until picked up', () => {
    expect(stageOf(id, false, fruitDay('2026-11-04'))).toBe('tree');
    expect(stageOf(id, true, fruitDay('2026-11-04'))).toBe('fall');
    markDropped('2026-11-04', id);
    expect(stageOf(id, true, fruitDay('2026-11-04'))).toBe('ground'); // a reload: no second fall
    markPicked('2026-11-04', id);
    expect(stageOf(id, true, fruitDay('2026-11-04'))).toBe('gone');
  });
  it('is per person and per fruit', () => {
    markPicked('2026-11-04', id);
    expect(stageOf(fruitId('B', 'apple'), true, fruitDay('2026-11-04'))).toBe('fall');
    expect(stageOf(fruitId('A', 'pear'), true, fruitDay('2026-11-04'))).toBe('fall');
  });
  it('a picked fruit counts as dropped, and marking twice keeps one entry', () => {
    markPicked('2026-11-04', id);
    markPicked('2026-11-04', id);
    expect(fruitDay('2026-11-04')).toEqual({ date: '2026-11-04', dropped: [id], picked: [id] });
  });
  it('the next Tokyo day starts fresh: back in the tree (grey until its goal) and falls again when met', () => {
    markPicked('2026-11-04', id);
    const next = fruitDay('2026-11-05');
    expect(next).toEqual({ date: '2026-11-05', dropped: [], picked: [] });
    expect(stageOf(id, false, next)).toBe('tree');
    expect(stageOf(id, true, next)).toBe('fall');
    markDropped('2026-11-05', id);
    expect(fruitDay('2026-11-04').picked).toEqual([]); // only one day is kept
  });
  it('a broken record or no storage at all starts empty (it falls again; no ベル hang on it)', () => {
    const kv = memKV();
    kv.setItem('fruit-day', '{"date":"2026-11-04","dropped":"x"}');
    configureStorage({ local: kv });
    expect(fruitDay('2026-11-04')).toEqual({ date: '2026-11-04', dropped: [], picked: [] });
    configureStorage({ local: null });
    expect(markPicked('2026-11-04', id).picked).toEqual([id]);
  });
});

describe('the tree layout', () => {
  it('a canopy spot and a ground spot for each goal, left to right in ring order', () => {
    expect(TREE_FRUIT).toHaveLength(RING_FRUITS.length);
    for (let i = 1; i < TREE_FRUIT.length; i++) expect(TREE_FRUIT[i][0]).toBeGreaterThan(TREE_FRUIT[i - 1][0]);
  });
});

describe('the goal fruit’s payout (2026-11-16: 60 a goal’s, 150 the gold one, credited to the tree’s owner)', () => {
  const metOf = (n: number) => (f: (typeof RING_FRUITS)[number]) => RING_FRUITS.indexOf(f) < n;
  it('the gold fruit is met only the day all four goals are', () => {
    for (let n = 0; n <= 4; n++) expect(fruitMet('gold', metOf(n))).toBe(n === 4);
    expect(RING_FRUITS.map((f) => fruitMet(f, metOf(2)))).toEqual([true, true, false, false]);
  });
  it('a picked-up fruit is its own goods: 60 a goal’s, 150 the gold one; the fruit picked up before keeps its 5', () => {
    expect(RING_FRUITS.map((f) => sellPrice(`goods:${fruitGoods(f)}`))).toEqual([60, 60, 60, 60]);
    expect(sellPrice(`goods:${fruitGoods('gold')}`)).toBe(150);
    expect(RING_FRUITS.map((f) => sellPrice(`goods:${f}`))).toEqual([5, 5, 5, 5]);
    // a perfect day's tree: 4 × 60 + 150
    expect([...RING_FRUITS, 'gold' as const].reduce((a, f) => a + sellPrice(`goods:${fruitGoods(f)}`)!, 0)).toBe(390);
  });
  it('the gold one is picked up once a day, as the others (its own id in the day)', () => {
    const d = '2026-11-16';
    expect(stageOf(fruitId('A', 'gold'), true, fruitDay(d))).toBe('fall');
    markPicked(d, fruitId('A', 'gold'));
    expect(stageOf(fruitId('A', 'gold'), true, fruitDay(d))).toBe('gone');
    expect(stageOf(fruitId('B', 'gold'), true, fruitDay(d))).toBe('fall');
    expect(stageOf(fruitId('A', 'gold'), true, fruitDay('2026-11-17'))).toBe('fall');
  });
  it('only the tree’s owner picks its fruit up (the room’s rule); other things anyone', () => {
    expect([pickMaySend('A', 'fr:A:apple'), pickMaySend('B', 'fr:A:apple'), pickMaySend('G', 'fr:B:gold'), pickMaySend('B', 'fr:B:gold')]).toEqual([true, false, false, true]);
    expect(pickMaySend('G', 's4560')).toBe(true);
  });
});
