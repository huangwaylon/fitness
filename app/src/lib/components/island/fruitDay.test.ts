import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { flowerOf, fruitDay, fruitFilter, fruitId, greyAt, markBloomed, markDropped, markPicked, stageOf } from './fruitDay.ts';
import { BED_FRUIT, TREE_FRUIT } from './scene.ts';
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
    expect(fruitDay('2026-11-04')).toEqual({ date: '2026-11-04', dropped: [id], picked: [id], bloomed: [] });
  });
  it('the next Tokyo day starts fresh: back in the tree (grey until its goal) and falls again when met', () => {
    markPicked('2026-11-04', id);
    const next = fruitDay('2026-11-05');
    expect(next).toEqual({ date: '2026-11-05', dropped: [], picked: [], bloomed: [] });
    expect(stageOf(id, false, next)).toBe('tree');
    expect(stageOf(id, true, next)).toBe('fall');
    markDropped('2026-11-05', id);
    expect(fruitDay('2026-11-04').picked).toEqual([]); // only one day is kept
  });
  it('a broken record or no storage at all starts empty (it falls again; no ベル hang on it)', () => {
    const kv = memKV();
    kv.setItem('fruit-day', '{"date":"2026-11-04","dropped":"x"}');
    configureStorage({ local: kv });
    expect(fruitDay('2026-11-04')).toEqual({ date: '2026-11-04', dropped: [], picked: [], bloomed: [] });
    configureStorage({ local: null });
    expect(markPicked('2026-11-04', id).picked).toEqual([id]);
  });
});

describe("a goal's flower through the day", () => {
  const id = fruitId('B', 'peach');
  it('a bud while not met, blooms once when first seen met, then stays open (a reload: no second bloom)', () => {
    expect(flowerOf(id, false, fruitDay('2026-11-04'))).toBe('bud');
    expect(flowerOf(id, true, fruitDay('2026-11-04'))).toBe('bloom');
    markBloomed('2026-11-04', id);
    expect(flowerOf(id, true, fruitDay('2026-11-04'))).toBe('open');
    markBloomed('2026-11-04', id);
    expect(fruitDay('2026-11-04').bloomed).toEqual([id]);
  });
  it('is per person and per goal, and independent of the fruit (picked up or not)', () => {
    markBloomed('2026-11-04', id);
    expect(flowerOf(fruitId('A', 'peach'), true, fruitDay('2026-11-04'))).toBe('bloom');
    expect(flowerOf(fruitId('B', 'apple'), true, fruitDay('2026-11-04'))).toBe('bloom');
    markPicked('2026-11-04', fruitId('B', 'apple'));
    expect(flowerOf(fruitId('B', 'apple'), true, fruitDay('2026-11-04'))).toBe('bloom');
    expect(fruitDay('2026-11-04')).toEqual({ date: '2026-11-04', dropped: ['B:apple'], picked: ['B:apple'], bloomed: [id] });
  });
  it('buds again the next Tokyo day, and blooms again once met', () => {
    markBloomed('2026-11-04', id);
    expect(flowerOf(id, false, fruitDay('2026-11-05'))).toBe('bud');
    expect(flowerOf(id, true, fruitDay('2026-11-05'))).toBe('bloom');
  });
  it('a record kept before the flowers (no bloomed list) keeps its fruit and starts the flowers as buds', () => {
    const kv = memKV();
    kv.setItem('fruit-day', '{"date":"2026-11-04","dropped":["A:pear"],"picked":[]}');
    configureStorage({ local: kv });
    expect(fruitDay('2026-11-04')).toEqual({ date: '2026-11-04', dropped: ['A:pear'], picked: [], bloomed: [] });
    expect(flowerOf(fruitId('A', 'pear'), true, fruitDay('2026-11-04'))).toBe('bloom');
  });
});

describe('the tree layout', () => {
  it('a canopy spot and a ground spot for each goal, left to right in ring order', () => {
    expect(TREE_FRUIT).toHaveLength(RING_FRUITS.length);
    for (let i = 1; i < TREE_FRUIT.length; i++) expect(TREE_FRUIT[i][0]).toBeGreaterThan(TREE_FRUIT[i - 1][0]);
  });
  it('each bed holds one flower per goal, in ring order reading back row then front row, left to right', () => {
    expect(BED_FRUIT.flat()).toEqual([...RING_FRUITS]);
  });
});
